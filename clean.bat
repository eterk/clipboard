@echo off
cd ./plugin
echo 正在删除 node_modules, package.json 和 package-lock.json...
rmdir /s /q node_modules
del /f package.json
del /f package-lock.json
echo 删除完成。