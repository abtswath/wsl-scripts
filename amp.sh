#!/usr/bin/env sh

action="start"

case $1 in
  "start"|"stop"|"restart")
    action=$1
    ;;
esac

service apache2 $action
service mysql $action
