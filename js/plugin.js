// 常量信息
const path = require('path');

let initMark = 0;

const { exec } = require('child_process');
// const html2canvas = require('html2canvas.min.js');

let container = new Array();

let eagle_home = path.dirname(eagle.app['execPath'])
let capture = eagle_home + "\\NiuniuCapture.exe";

function getPicsDiv() {
	return document.getElementById('pictures');
}

/**
 * 未开发完成,我想实现截图工具在不同的屏幕上运行的问题
 * @returns 获取当前的屏幕
 */
function getCurrentDiplay() {

	let display = getCurrentDiplay()

	console.log(display)
	id = 2528732444
	args = ` --display ` + id
	console.log(args)

	return eagle.screen.getCursorScreenPoint()
		.then(point => {
			console.log(point)

			return eagle.screen.getDisplayNearestPoint(point);
		})
}

function getScreenShot() {
	return new Promise((resolve, reject) => {
		eagle.log.info(`call ${capture}`);

		exec(`"` + capture + `"`, (error, stdout, stderr) => {
			resolve(eagle.clipboard.readImage());
		});
	});
}

function getInputElements(id) {
	let inputPanel = document.getElementById(id);


	return inputPanel.getElementsByTagName('input');
}
function getInputItemInfo() {
	let inputs = getInputElements("input-panel")
	return getItemInfo(inputs, defaultInfo)
}

/**
 * default proto  for pic label
 */
let defaultInfo = {
	name: "ScreenShot" + new Date().getTime(),
	website: '',
	tags: ["ScreenShot"],
	folders: [],
	annotation: '',
};


function getItemInfo(inputs, proto) {

	let item = {};

	for (let i = 0; i < inputs.length; i++) {
		let inputName = inputs[i].name;
		let inputValue = inputs[i].value;

		if (inputValue === '') {
			item[inputName] = proto[inputName];
		} else {
			if (inputName === 'tags' || inputName === 'folders') {
				// 替换全角逗号为半角逗号，然后分割字符串
				item[inputName] = inputValue.replace(/，/g, ',').split(',');
			} else {
				item[inputName] = inputValue;
			}
		}
	}

	return item
}


function shotAndRead() {
	eagle.window.hide()
		.then(window => {
			return getScreenShot()
		})
		.then(image => {
			let obj = {}
			obj.img = image
			obj.name = "pic" + container.length
			container.push(obj)
			displayPic(obj, getPicsDiv())
		}).catch(error => {
			console.error(`调用 Eagle 截图功能时出错：${error.message}`);
		}).then(any => {
			eagle.window.show()
		});
}

function clearAll() {
	clearLabel()
	clearPic()
}
function clearLabel() {
	let inputs = getInputElements("input-panel")
	eagle.log.info(`call clearLabel`);
	for (let i = 0; i < inputs.length; i++) {
		inputs[i].value = '';
	}
}
function clearPic(){
	let picsDiv = getPicsDiv()
	container = [];
	picsDiv.innerHTML = ""
}
function windowHide() {
	eagle.window.hide()
}


function displayPic(imgObj, picsDiv) {
	let wrap = document.createElement("div");
	wrap.className = 'img-wrap'

	let img = document.createElement('img');
	img.src = imgObj.img.toDataURL();
	img.id = imgObj.name;
	img.className = 'cap-img';

	// 创建右键点击菜单
	let contextMenu = document.createElement('div');
	contextMenu.className = 'context-menu';
	contextMenu.style.display = 'none';

	// 创建删除选项
	let deleteOption = document.createElement('div');
	deleteOption.textContent = '删除';

	deleteOption.onclick = function () {
		wrap.remove();
	};


	contextMenu.appendChild(deleteOption);

	wrap.onmouseover = function (e) {
		contextMenu.style.display = 'block';
		contextMenu.style.left = e.pageX + 'px';
		contextMenu.style.top = e.pageY + 'px';
	};

	wrap.onmouseout = function () {
		contextMenu.style.display = 'none';
	};

	wrap.appendChild(img)
	wrap.appendChild(contextMenu)
	picsDiv.appendChild(wrap);
}

eagle.onPluginCreate((plugin) => {
	eagle.window.hide()
});

eagle.onPluginRun(() => {
	if (initMark == 0) {
		initMark = 1
	} else {
		shotAndRead()
	}

	console.log('eagle.onPluginRun');
});

// eagle.onPluginShow(() => {
// 	console.log('eagle.onPluginShow');
// });

// eagle.onPluginHide(() => {
// 	console.log('eagle.onPluginHide');
// });

eagle.onPluginBeforeExit((event) => {
	console.log('eagle.onPluginBeforeExit');
});