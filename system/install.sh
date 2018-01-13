#!/bin/bash

[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 1; }

ODIR="$(pwd)"
cd "$(dirname "$0")"
SCRIPTDIR="$(pwd)"
cd "$ODIR"


INSTALLDIR="$(dirname "$SCRIPTDIR")"


getent passwd wlanguests-web &>/dev/null || {
	useradd -d /nonexistant -M -s /usr/sbin/nologin wlanguests-web && \
	usermod -L wlanguests-web || {
		echo "failed creating non-privileged user wlanguests-web" >&2
		exit 2
	}
}


[ -e "$INSTALLDIR/environment.local.conf" ] || {
	cp "$INSTALLDIR/environment.conf" "$INSTALLDIR/environment.local.conf"
}

chown wlanguests-web "$INSTALLDIR/data"


for NAME in wlanguests.path wlanguests.service wlanguests-web.service
do
	awk -F '%%INSTALLDIR%%' -v installdir="$INSTALLDIR" "
NF>1 { printf \"%s%s%s\n\",\$1,installdir,\$2 }
NF<2 { print \$1 }
	" <"$SCRIPTDIR/$NAME" >"/etc/systemd/system/$NAME"
done


systemctl daemon-reload

systemctl enable wlanguests.path

systemctl enable wlanguests.service
systemctl enable wlanguests-web.service


cat >/etc/cron.d/wlanguests-purge <"$INSTALLDIR/environment.local.conf"

cat >>/etc/cron.d/wlanguests-purge <<EOT
* * * * * root CP_PURGE=1 cd $INSTALLDIR/data && ../system/update-iptables.sh
EOT


TOOL="$(which shutdown)"

cat >/etc/sudoers.d/shutdown <<EOT
wlanguests-web ALL = NOPASSWD: $TOOL
EOT
