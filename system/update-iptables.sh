#!/bin/bash

[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 1; }

[ "${1}" == "flocked" ] || {
	flock . "${0}" flocked
	exit $?
}


MAX_AGE="${CP_MAX_LEASE_TIME:-60}"


# remove outdated leases
find . -maxdepth 1 -type f -name "*.mac" -mmin "+$MAX_AGE" -delete


# remove rules lacking related file
while read RULE; do
	MAC="${RULE##*--mac-source }"
	MAC="${MAC%% *}"
	FILE="${MAC//:/_}"
	[ -e "$FILE.mac" -o -e "${FILE^^}.mac" -o -e "${FILE,,}.mac" ] || {
		iptables -t mangle -D ${RULE#-A }
	}
done < <(iptables -t mangle -S PREROUTING | grep -e '--mac-source')


[ -n "$CP_PURGE" ] && exit 0


# add rule for every file lacking one
while read FILE; do
	FILE="$(basename "$FILE")"
	MAC="${FILE%.mac}"
	MAC="${MAC//_/:}"

	RULE="-t mangle -m mac --mac-source $MAC -j MARK --set-mark 2"
	iptables -C PREROUTING $RULE || iptables -I PREROUTING 1 $RULE
done < <(find . -maxdepth 1 -type f -name "*.mac" -mmin "-$MAX_AGE")
