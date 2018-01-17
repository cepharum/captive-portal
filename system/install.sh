#!/bin/bash

# require to be run as root
[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 1; }

# get absolute pathname of current script file
ODIR="$(pwd)"
cd "$(dirname "$0")"
SCRIPTDIR="$(pwd)"
cd "$ODIR"

# derive absolute pathname of folder containing installer
INSTALLDIR="$(dirname "$SCRIPTDIR")"


# create non-privileged user for running software unless created before
getent passwd wlanguests-web &>/dev/null || {
	useradd -d /nonexistant -M -s /usr/sbin/nologin wlanguests-web && \
	usermod -L wlanguests-web || {
		echo "failed creating non-privileged user wlanguests-web" >&2
		exit 2
	}
}


# create local configuration unless created before
[ -e "$INSTALLDIR/environment.local.conf" ] || {
	cp "$INSTALLDIR/environment.conf" "$INSTALLDIR/environment.local.conf"
}


# permit created user to write into data folder of installer's folder
chown wlanguests-web "$INSTALLDIR/data"


# install patched versions of systemd unit files
for NAME in wlanguests.path wlanguests.service wlanguests-web.service
do
	awk -F '%%INSTALLDIR%%' -v installdir="$INSTALLDIR" "
NF>1 { printf \"%s%s%s\n\",\$1,installdir,\$2 }
NF<2 { print \$1 }
	" <"$SCRIPTDIR/$NAME" >"/etc/systemd/system/$NAME"
done


# discover and enable all systemd unit files
systemctl daemon-reload

systemctl enable wlanguests.path
systemctl enable wlanguests.service
systemctl enable wlanguests-web.service


# create cron record for running script purging outdated WLAN guests every minute
cat >/etc/cron.d/wlanguests-purge <"$INSTALLDIR/environment.local.conf"

cat >>/etc/cron.d/wlanguests-purge <<EOT
* * * * * root CP_PURGE=1 cd $INSTALLDIR/data && ../system/update-iptables.sh
EOT


# configure sudo to permit created non-privileged user shutting down the host
TOOL="$(which shutdown)"

cat >/etc/sudoers.d/shutdown <<EOT
wlanguests-web ALL = NOPASSWD: $TOOL
EOT


# detect context
WIFI_NIC=$(awk -F : '$1~/wlan/{print$1}' </proc/net/dev)
WIFI_NIC="$(echo $WIFI_NIC)"
WIFI_IP=$(/sbin/ip -o -4 addr list $WIFI_NIC | awk 'NR==1{print $4}' | cut -d/ -f1)
DEFAULT_ROUTE_NIC=$(route -n | awk '$1=="0.0.0.0"{print$8}')
GATEWAY_IP=$(route -n | awk '$1=="0.0.0.0"{print$2}')
GATEWAY_NETMASK="$(route -n | awk '$8=="eth0"&&$1!="0.0.0.0"{print$3}')"

IFS=. read -r i1 i2 i3 i4 <<< "$GATEWAY_IP"
IFS=. read -r m1 m2 m3 m4 <<< "$GATEWAY_NETMASK"
GATEWAY_NETWORK_IP="$(printf "%d.%d.%d.%d\n" "$((i1 & m1))" "$((i2 & m2))" "$((i3 & m3))" "$((i4 & m4))")"

if whiptail --yesno "Detected network context:

     WiFi device: $WIFI_NIC
              IP: $WIFI_IP

  Gateway device: $DEFAULT_ROUTE_NIC
              IP: $GATEWAY_IP
         netmask: $GATEWAY_NETMASK

Is this correct?" 16 50
then
	checkIpTablesRule() {
		TABLE="$1"
		RULE="$2"
		INFO="$3"

		echo -n " * $INFO ... " >&2

		if /sbin/iptables -t $TABLE -C $RULE &>/dev/null
		then
			echo "OK" >&2
		else
			if whiptail --yesno "Missing rule for $INFO.

Do you want to add this rule now?

iptables -t $TABLE -A $RULE" 14 80
			then
				/sbin/iptables -t $TABLE -A $RULE || {
					echo "FAILED" >&2
					exit 1
				}

				echo "OK" >&2
			else
				echo "SKIPPED" >&2
			fi
		fi
	}

	source "$INSTALLDIR/environment.local.conf"

	# check iptables setup
	echo "check iptables configuration" >&2
	checkIpTablesRule "mangle" "PREROUTING -m mark -i $WIFI_NIC --mark 0x0 -j MARK --set-xmark 0x1" "initially marking all traffic from any WiFi client as unauthenticated"
	checkIpTablesRule "filter" "INPUT -i $WIFI_NIC -p tcp -m tcp --dport 631 -m mark --mark 0x1 -j REJECT" "blocking access on local print server from unauthenticated WiFi clients"
	checkIpTablesRule "filter" "FORWARD -m mark --mark 0x1 -j DROP" "blocking all forwarded requests from unauthenticated clients"
	checkIpTablesRule "filter" "FORWARD -m mark --mark 0x2 -d $GATEWAY_IP/$GATEWAY_NETMASK -j DROP" "blocking forwarded requests from authenticated clients to local network"
	checkIpTablesRule "nat" "PREROUTING -i wlan0 -p tcp -m tcp --dport 80 -m mark --mark 0x1 -j DNAT --to-destination $WIFI_IP:$CP_PUBLIC_PORT" "redirecting all unauthenticated requests from WiFi clients to local web service for logging in"
	checkIpTablesRule "nat" "POSTROUTING -o eth0 -m mark --mark 0x2 -j MASQUERADE" "masquerading all forwarded requests from authenticated clients"
fi
