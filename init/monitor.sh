#!/bin/bash
readonly PROG_DIR=$(readlink -m $(dirname $0))
sercd=$PROG_DIR/../sercd
log=$PROG_DIR/../logs/monitor.log

function auto_restart(){
	status=`$sercd status`
	if [ "$status" == "Serc server is not running" ];then
		$sercd restart
		echo "`date +%F' '%H:%M:%S`[error]	Serc server is not running and restarted" >> $log
	else
		echo "`date +%F' '%H:%M:%S`[info]	Serc server is running" >> $log
	fi	
	/etc/init.d/ntp stop
	sleep 2
	ntpdate pool.ntp.org >> $log
	/etc/init.d/ntp start
}

auto_restart
