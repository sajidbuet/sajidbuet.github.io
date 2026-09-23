---
title: Pi Web Kiosk
summary: Config-driven dual-display Raspberry Pi signage with offline caching, live-site failover and scheduled refresh, running in the EEE main lobby.
description: Pi Web Kiosk is a config-driven Raspberry Pi digital-signage system that drives two Chromium windows across an extended dual-display desktop, with an offline cache, automatic failover, scheduled refresh and daily reboot.

date: 2025-09-24
lastmod: 2025-09-24

project_category: software
status: active
featured: true

license: MIT

technologies:
  - Raspberry Pi
  - Bash
  - Chromium

project_links:
  repository: https://github.com/sajidbuet/pi-web-kiosk

collaborators:
  - me

# Sourced only from the repository: its description ("Dual-monitor Raspberry Pi
# web kiosk with offline cache, live failover, periodic refresh & daily reboot
# — fully config-driven via JSON."), README, LICENSE (MIT) and the language
# breakdown (Shell, 11,656 bytes — the repository is shell scripts, a systemd
# unit and JSON config). The deployment sentence below is the README's own:
# "The kiosk is used in Department of Electrical and Electronic Engineering,
# BUET's main lobby."
---

## Motivation

A lobby display has to keep showing something sensible when nobody is watching
it: when the network drops, when the site it mirrors is down, when the machine
has been running for a fortnight, and outside the hours anyone is there to see
it. Doing that reliably on a Raspberry Pi is mostly a matter of configuration
rather than code, so the whole system is driven from a JSON file.

## What it does

Two Chromium kiosk windows are placed across an extended dual-display desktop.
Content is mirrored to an offline cache at setup, and the kiosk falls back to
that cache automatically when the network or the live site is unavailable,
switching back to the live URL once connectivity returns. A hard refresh runs
every few hours, the machine reboots daily at a configurable time, and display
hours, active weekdays and holiday handling are all set in the same
configuration file. Startup and recovery are handled by systemd.

## Status

Active, and in use: the README records that the kiosk runs the information
display in the main lobby of the Department of Electrical and Electronic
Engineering, BUET. MIT-licensed, with the setup script and systemd unit in the
repository.
