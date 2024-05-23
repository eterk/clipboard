/**********************************************
 *        常量与html环境相关代码               *
 **********************************************/

const path = require('path');

// ocr 工具模块
// const { createWorker } = require('tesseract.js'); //这个依赖多线程版本
const { createWorker } = require('tesseract.js/dist/tesseract.min.js');
const fs = require('fs');
const { exec } = require('child_process');
const { nativeImage } = require('electron');
function getPicsDiv() {
	return document.getElementById('pictures');
}

/**
 * default proto  for pic label
 */
function defaultLabel() {
	let texts = container.concatText()

	let label = {
		name: "ScreenShot" + new Date().getTime(),
		website: '',
		tags: ["ScreenShot"],
		folders: [],
		annotation: texts,
	};
	return label

}


let eagle_home = path.dirname(eagle.app['execPath'])

let capture = eagle_home + "\\NiuniuCapture.exe";

/**********************************************
 *                  container                 *
 **********************************************/
class Container {
	constructor() {
		this.seq = [];
	}
	length() {
		return this.seq.length
	}
	concatText() {
		return this.seq.map(item => removeExtraSpaces(item.text)).join('\n');
	}

	isReady() {
		return this.seq.every(obj => obj.state === 1)
	}
	msg() {
		return this.seq.filter(obj => obj.state === 1).length + " / " + this.length()
	}
	state() {
		return {
			isReady: this.isReady(),
			msg: this.msg(),
			size: this.length()
		}
	}
	push(image) {
		let obj = {
			img: image,
			name: "pic_" + new Date().getTime(),
			text: "",
			state: 0
		}
		let img = document.createElement('img');
		if (typeof image === "string") {
			img.src = "data:image/png;base64," + image
			obj.state = 1;
		} else {
			// if (typeof image === "NativeImage") 
			resloveText(image.toPNG({})).then(txt => {
				obj.text = txt;
				obj.state = 1;
			})

			img.src = obj.img.toDataURL();
		}
		obj.html = imgObjToElement(obj.name, img)
		this.seq.push(obj)
		getPicsDiv().appendChild(obj.html)
	}

	removeByName(name) {
		this.seq = this.seq.filter(item => item.name !== name);
	}
}

let container = new Container();

/**********************************************
 *                  state                     *
 **********************************************/
function resloveText(buffer) {
	if (ocrSwitch) {
		return recognizeTextFromBuffer(buffer);
	} else {
		return new Promise((resolve, reject) => {
			resolve('');
		});
	}
}

let initMark = true;

let ocrSwitch = true;

function logState() {
	let state = container.state();
	state.init = initMark;
	state.ocrSwitch = ocrSwitch;
	state.picEmpty = picturesEmpty();

	selectEmpty()
		.then(empty => {
			state.selectEmpty = empty;
			console.log(state);
		})
}

function picturesEmpty() {
	return getPicsDiv().childNodes.length == 0
}
async function selectEmpty() {
	let items = await eagle.item.getSelected();

	return items.length <= 1
}
async function getSelectItems() {
	return await eagle.item.getSelected();
}

/**
 * 当没有图片的时候不显示保存和清理按钮,否则显示
 */
function buttonUpdate() {
	updateNeedPicButton()
	updateNeedSelectButton()

}
function updateNeedPicButton() {
	let hidden = picturesEmpty()
	// 获取 class 为 a 的所有元素
	var elements = document.getElementsByClassName('need-pic');

	// 遍历所有元素，将它们设置为不可见
	for (var i = 0; i < elements.length; i++) {
		elements[i].hidden = hidden;
	}
}
function updateNeedSelectButton() {
	selectEmpty()
		.then(hidden => {
			// 获取 class 为 a 的所有元素
			var elements = document.getElementsByClassName('need-select');
			// 遍历所有元素，将它们设置为不可见
			for (var i = 0; i < elements.length; i++) {
				elements[i].hidden = hidden;
			} ``
		})
}

async function readBase64Image(filePath) {
	let imageBuffer = fs.readFileSync(filePath);
	return Buffer.from(imageBuffer).toString('base64');
}
async function readImages(filePaths) {
	return await Promise.all(filePaths.map(p => readBase64Image(p)));
}
async function pushImages(images) {
	return await Promise.all(images.map(img => container.push(img)));
}

function getInputItemInfo() {
	let inputs = getInputElements("input-panel", 'input')
	return mixProtoAndInput(inputs, defaultLabel())
}
function clearAll() {
	console.log("clearAll called");
	clearLabel()
	clearPic()
	buttonUpdate()
}
function clearLabel() {
	let inputs = getInputElements("input-panel", 'input')
	for (let i = 0; i < inputs.length; i++) {
		inputs[i].value = '';
	}
}
function clearPic() {
	let picsDiv = getPicsDiv()
	container = new Container()
	picsDiv.innerHTML = ""
}
function windowHide() {
	eagle.window.hide()
}

/**
 * 未开发完成,我想实现截图工具在不同的屏幕上运行的问题
 * @returns 获取当前的屏幕
 */
function getCurrentDiplay() {

	// let display = getCurrentDiplay()
	// id = 2528732444
	// args = ` --display ` + id

	return eagle.screen.getCursorScreenPoint()
		.then(point => {
			return eagle.screen.getDisplayNearestPoint(point);
		})
}



function getScreenShot() {
	return new Promise((resolve, reject) => {
		eagle.log.info(`call ${capture}`);

		exec(`"` + capture + `"`, (error, stdout, stderr) => {
			//todo exec 总是显示error
			//todo 无论截图取消或者成功,都会读取之前剪贴板里的图片
			resolve(eagle.clipboard.readImage());
		});
	});
}

/**********************************************
 *                  util                     *
 **********************************************/
function getInputElements(id, tagName) {
	let inputPanel = document.getElementById(id);

	return inputPanel.getElementsByTagName(tagName);
}

// 将OCR操作封装成一个函数
async function recognizeTextFromBuffer(buffer) {
	const worker = await createWorker(['eng', 'chi_sim'])
	const { data: { text } } = await worker.recognize(buffer); // 直接传递Buffer
	await worker.terminate();
	return text;
}


function removeExtraSpaces(str) {
	// Replace consecutive spaces with a single space
	str = str.replace('/\s+/g', '');

	// Remove leading and trailing spaces
	str = str.trim();

	let cnOrSign = /([\u4e00-\u9fa5]|[\u3000-\u303F]|[<>!-\/:-@\[-`{-~])/;
	let number = /([0-9])/
	let dirt = '[\\s\\n]'
	// 状态之间有关联,只能一点一点的匹配删除空格

	let r1 = new RegExp(cnOrSign.source + dirt + cnOrSign.source, 'g');
	let r2 = new RegExp(number.source + dirt + cnOrSign.source, 'g');
	let r3 = new RegExp(cnOrSign.source + dirt + number.source, 'g');
	str = str.replace(r1, '$1$2').replace(r2, '$1$2').replace(r3, '$1$2')

	return str;
}

function mixProtoAndInput(inputs, proto) {

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
			container.push(image);
		})
		.catch(error => {
			console.error(`调用 Eagle 截图功能时出错：${error.message}`);
		})
		.then(any => {
			buttonUpdate()
			eagle.window.show()
		})


}
function mergeItems() {
	logState()
	getSelectItems()
		.then(items => {


			//todo  有空处理以下 多图合并后的标签合并问题

			// 然后，我们将所有项目的 tags 合并到一个数组中，并去重
			let allTags = [...new Set(items.flatMap(item => item.tags))];
			// 我们也将所有项目的 annotations 按照 "\n" 拼接
			let allAnnotations = items.map(item => item.annotation).join('\n');
			// 最后，我们获取所有项目的 id 和 path
			let ids = items.map(item => item.id);
			console.log('All Tags: ', allTags);
			console.log('All Annotations: ', allAnnotations);
			console.log('IDs: ', ids);


			let paths = items.map(item => item.filePath);

			readImages(paths)
				.then(imgs => {
					pushImages(imgs)
				})
				.then(any => {
					buttonUpdate()
					// eagle.window.show()
				})
		})

	logState()
	console.log("merge-item")
}


function originSize() {
	const div = getPicsDiv()

	const fullPageHeight = document.documentElement.scrollHeight;
	const fullPageWeight = document.documentElement.scrollWidth;
	const height = div.scrollHeight + 10;
	const width = div.scrollWidth + 20;
	let sizeInfo = {}
	sizeInfo.height = height
	sizeInfo.width = width
	return sizeInfo
}
// 测试函数
function getText() {
	console.log("getText")
	let png = container.seq[1].toPNG({})  // 这个没改格式
	recognizeTextFromBuffer(png)
		.then(txt => console.log(txt))
}




function imgObjToElement(name, img) {
	let wrap = document.createElement("div");
	wrap.className = 'img-wrap'


	img.id = name;
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
		container.removeByName(name);
		console.log(container.length());
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
	return wrap
}

eagle.onPluginCreate((plugin) => {
	console.log('eagle.onPluginCreate');
	eagle.window.hide()
});

eagle.onPluginRun(() => {
	logState()
	if (initMark) {
		initMark = false
	} else {
		selectEmpty()
			.then(empty => {
				if (empty) {
					return shotAndRead();
				} else {
					return mergeItems();
				}
			})

	}
	logState()
	console.log('eagle.onPluginRun');
});

eagle.onPluginShow(() => {
	console.log('eagle.onPluginShow');
});

eagle.onPluginHide(() => {
	console.log('eagle.onPluginHide');
});

eagle.onPluginBeforeExit((event) => {
	console.log('eagle.onPluginBeforeExit');
});