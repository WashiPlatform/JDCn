#!/bin/bash
readonly PROG_DIR=$(readlink -m $(dirname $0))
jdcnd=$PROG_DIR/../jdcnd
log=$PROG_DIR/../logs/monitor.log

function auto_restart(){
	status=`$jdcnd status`
	if [ "$status" == "Jdcn server is not running" ];then
		$jdcnd restart
		echo "`date +%F' '%H:%M:%S`[error]	Jdcn server is not running and restarted" >> $log
	else
		echo "`date +%F' '%H:%M:%S`[info]	Jdcn server is running" >> $log
	fi	
	/etc/init.d/ntp stop
	sleep 2
	ntpdate pool.ntp.org >> $log
	/etc/init.d/ntp start
}

auto_restart
