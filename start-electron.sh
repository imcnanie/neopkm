#!/bin/bash                                                                                                                                                                                                        
export XAUTHORITY=$HOME/.Xauthority                                                                                                                                                                                
export DISPLAY=:1                                                                                                                                                                                                  
mkdir -p ~/.local/share/xorg                                                                                                                                                                                       
export Xft.dpi=192
export XCURSOR_THEME=Adwaita
export XCURSOR_SIZE=48

exec dbus-launch --exit-with-session startx /nix/store/9w0kckvln7sh814ah7bdx5zs9hja9479-electron-27.3.11/bin/electron /home/printer/projects/neopkm/main.js -- :1 -dpi 192

