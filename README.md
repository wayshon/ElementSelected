# ElementSelected
获取 html 点击的元素，返回元素信息。
点击元素在没有阻止冒泡的情况下会出发

### npm
- 安装
    `npm install element-selected --save`
- 使用

    ```JavaScript
    var ElementSelected = require('element-selected');
    /**
     * 获取点击的元素 
     * @param {Function} callback 
     * @param {String} mouseType 可选,默认 mousedown
     * @param {HTMLElement} element 可选, 默认 document
     * @return {Array} result, event
     * result: {uniqueId:'路径',xPath,text:'innerText',top,left,viewTop,viewLeft} 
     * event: 点击的元素
     */
    ElementSelected(function(result, event) {
        console.log(result, event)
    }, 'click', document)

    var elements = ElementSelected.getElementByXPath(xPath)
    ```

### html页面
- 安装
    下载`index.js`文件并用`<script>`标签在页面中引入