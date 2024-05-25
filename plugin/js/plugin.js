/**********************************************
 *        常量与html环境相关代码               *
 **********************************************/

const path = require('path');

// ocr 工具模块
// const { createWorker } = require('tesseract.js'); //这个依赖多线程版本
const { createWorker } = require('tesseract.js/dist/tesseract.min.js');
const fs = require('fs');
const { exec } = require('child_process');

function getPicsDiv() {
	return document.getElementById('pictures');
}

/**
 * default proto  for pic label
 */
function defaultLabel() {
	let texts = container.concatText()
	let tags = container.collectTags();

	let label = {
		name: "ScreenShot" + new Date().getTime(),
		website: '',
		tags: tags,
		folders: [],
		annotation: texts,
	};
	return label

}

let eagle_home = path.dirname(eagle.app['execPath'])

let capture = `${eagle_home}\\NiuniuCapture.exe`;

/**********************************************
 *                  container                 *
 **********************************************/
class ContextElement {

	constructor(image) {
		this.context = image;
		this.contextType = typeof image === "string" ? 'base64Image' : 'nativeImage';
		this.tags = [];
		this.name = "pic_" + new Date().getTime();
		this.text = "";
		this.state = 0;
		this.src = "";
		this.html = "";
	}

	compelete() {
		this.updateSrc();
		this.updateState();
		this.updateHtml();
		return this;
	}

	updateLabel(name, tags, text) {
		this.name = name;
		this.tags = tags;
		this.text = text;
		return this;
	}

	updateSrc() {
		switch (this.contextType) {
			case 'base64Image':
				this.src = "data:image/png;base64," + this.context;
				break;
			case 'nativeImage':
				this.src = this.context.toDataURL();
				break;
			default:
				break;
		}
	}
	updateState() {
		switch (this.contextType) {
			case 'nativeImage':
				resloveText(this.context.toPNG({}))
					.then(txt => {
						this.text = removeExtraSpaces(txt);
						this.state = 1;
					})
				break;
			default:
				this.state = 1;
				break;
		}

	}
	updateHtml() {
		let wrap = document.createElement("div");
		wrap.className = 'img-wrap'
		let img = document.createElement('img');
		img.src = this.src;
		img.id = this.name;
		img.className = 'cap-img';
		wrap.appendChild(img)

		this.html = wrap
	}

}

class Container {

	constructor() {
		this.seq = [];
	}


	length() {
		return this.seq.length
	}
	collectTags() {
		return [...new Set(this.seq.flatMap(item => item.tags))]
	}
	concatText() {
		return this.seq.map(item => item.text).join('\n');
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

	push(context) {
		this.seq.push(context);
		getPicsDiv().appendChild(context.html)

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
	if (switchDict['ocrSwitch']) {
		return recognizeTextFromBuffer(buffer);
	} else {
		return new Promise((resolve, reject) => {
			resolve('');
		});
	}
}


let scaleSize = 1;

let switchDict = {
	"prodMode": true,
	"clearAfterSave": true,
	"ocrSwitch": true,
	"initMark": true
}

function pushSwitch(id) {
	switchDict[id] = !switchDict[id]

	let value = switchDict[id]

	let element = document.getElementById(id)

	element.style.backgroundColor = value ? '#4CAF50' : '#F44336'

	element.innerText = value ? '开启' : '关闭'
}

const logState = async () => {

	state = {
		...container.state(),
		...switchDict,
		picEmpty: picturesEmpty(),
		selectEmpty: await selectEmpty()
	};
	console.log(state);
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


function updateWindowSize() {
	const pictures = getPicsDiv()

	const bodyWrap = document.getElementById('body-wrap');

	let picSize = (pictures.offsetHeight * scaleSize)

	bodyWrap.style.height = Math.max(picSize + 10, 550) + 'px';
}
function getPicSize() {
	const pictures = getPicsDiv()

	return {
		height: pictures.offsetHeight * scaleSize,
		width: pictures.offsetWidth * scaleSize
	}
}
/**
 * 当没有图片的时候不显示保存和清理按钮,否则显示
 */
function buttonUpdate() {
	hiddenClassElement('need-pic', picturesEmpty());
	dragAble();
	updateWindowSize();

	// todo  暂时关闭以下按钮,没开发好逻辑,尚有欠缺
	// selectEmpty()
	// 	.then(hidden => hiddenClassElement('need-select', hidden))

}

async function readBase64Image(filePath) {
	let imageBuffer = fs.readFileSync(filePath);
	return Buffer.from(imageBuffer).toString('base64');
}
function labeledImageToContextEle(obj) {
	return new ContextElement(obj.img)
		.updateLabel(obj.name, obj.tags, obj.annotation)
		.compelete();
}
async function getLabeledImages(items) {
	let arr = await Promise.all(items.map(async item => {
		return {
			id: item.id,
			name: item.id,
			path: item.filePath,
			annotation: item.annotation,
			tags: item.tags,
			img: await readBase64Image(item.filePath)
		};
	}));

	return arr;
}

function dragAble() {
	// 获取所有的 .img-wrap 元素
	var imgWraps = document.querySelectorAll('.img-wrap');

	// 遍历所有的 .img-wrap 元素
	for (var i = 0; i < imgWraps.length; i++) {
		var imgWrap = imgWraps[i];

		// 设置 draggable 属性
		imgWrap.draggable = true;

		// 监听 dragstart 事件
		imgWrap.addEventListener('dragstart', function (e) {
			e.dataTransfer.setData('text/plain', e.target.id);
		});

		// 监听 dragover 事件
		imgWrap.addEventListener('dragover', function (e) {
			e.preventDefault();
		});

		// 监听 drop 事件
		imgWrap.addEventListener('drop', function (e) {
			e.preventDefault();
			var draggedId = e.dataTransfer.getData('text/plain');
			var draggedEl = document.getElementById(draggedId);
			e.target.parentNode.insertBefore(draggedEl, e.target.nextSibling);
		});
	}

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



async function getScreenShot11() {
	return await eagle.window.capturePage();
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
function createSliderBar(parentEle, label, min, max, step, value, func) {
	const sliderBar = document.createElement('div');
	sliderBar.classList.add('slider-bar');

	const sliderLabel = document.createElement('div');
	sliderLabel.classList.add('slider-label');
	sliderLabel.style.width = '25%';
	sliderLabel.innerText = label + ":";
	sliderBar.appendChild(sliderLabel);

	const sliderInput = document.createElement('input');
	sliderInput.setAttribute('type', 'range');
	sliderInput.setAttribute('min', min);
	sliderInput.setAttribute('max', max);
	sliderInput.setAttribute('step', step);
	sliderInput.setAttribute('value', value);

	sliderInput.classList.add('slider-input');
	sliderInput.style.width = '60%';
	sliderBar.appendChild(sliderInput);

	const sliderValue = document.createElement('div');
	sliderValue.classList.add('slider-value');
	sliderValue.style.width = '15%';
	sliderValue.textContent = sliderInput.value;
	sliderBar.appendChild(sliderValue);

	let firstChild = parentEle.firstChild;

	parentEle.insertBefore(sliderBar, firstChild);

	console.log(sliderBar);


	sliderInput.addEventListener('input', function (event) {
		sliderValue.textContent = sliderInput.value;
		func(event)
	});
}

function hiddenClassElement(className, hidden) {
	// 获取 class 为 a 的所有元素
	var elements = document.getElementsByClassName(className);
	// 遍历所有元素，将它们设置为不可见
	for (var i = 0; i < elements.length; i++) {
		elements[i].hidden = hidden;
	}

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

		if (inputValue === '' | inputValue.isEmpty) {
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
		.catch(error => {
			console.error(`调用 Eagle 截图功能时出错：${error.message}`);
		})
		.then(image => {
			if (!image.isEmpty()) {
				let obj = new ContextElement(image)
					.compelete()
				container.push(obj);
			}
			return !image.isEmpty()
		})
		.then(show => {
			if (show) {
				buttonUpdate()
			}
			eagle.window.show()
		})


}
function mergeItems() {
	console.log("merge-item")
	getSelectItems()
		.then(items => {
			getLabeledImages(items)
				.then(imgs => {
					imgs.forEach(img =>
						container.push(labeledImageToContextEle(img)))
				})
				.then(any => {
					buttonUpdate()
					eagle.window.show()
				})
		})


}

eagle.onPluginCreate((plugin) => {
	console.log('eagle.onPluginCreate');
	hiddenClassElement("need-select", switchDict['prodMode']);
	eagle.window.hide()
});



eagle.onPluginRun(() => {
	// eagle.window.hide()
	if (switchDict['initMark']) {
		switchDict['initMark'] = false
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