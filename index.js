//获取xpath
function readXPath(element) {
    if (element.id !== "") {//判断id属性，如果这个元素有id，则显 示//*[@id="xPath"]  形式内容
        return '//*[@id=\"' + element.id + '\"]';
    }
    //这里需要需要主要字符串转译问题，可参考js 动态生成html时字符串和变量转译（注意引号的作用）
    if (element == document.body) {//递归到body处，结束递归
        return '/html/' + element.tagName.toLowerCase();
    }
    var ix = 1,//在nodelist中的位置，且每次点击初始化
        siblings = element.parentNode.childNodes;//同级的子元素

    for (var i = 0, l = siblings.length; i < l; i++) {
        var sibling = siblings[i];
        //如果这个元素是siblings数组中的元素，则执行递归操作
        if (sibling == element) {
            return arguments.callee(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix) + ']';
            //如果不符合，判断是否是element元素，并且是否是相同元素，如果是相同的就开始累加
        } else if (sibling.nodeType == 1 && sibling.tagName == element.tagName) {
            ix++;
        }
    }
};

function getDeepElement() {
    /**
 * 获取元素位置
 * @param {dom} elem 
 */
    function getCoords(elem) {
        var box = elem.getBoundingClientRect();
        var body = document.body;
        var docEl = document.documentElement;
        var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
        var clientTop = docEl.clientTop || body.clientTop || 0;
        var clientLeft = docEl.clientLeft || body.clientLeft || 0;
        var top = box.top + scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;
        return { top: Math.round(top), left: Math.round(left) };
    }

    function initFunction() {
        var init = function (argument) {
            if (typeof (WeakMap) !== "undefined") {
                this.resultsMap = new WeakMap()
            }
            this.lastClick = document.body;
            var that = this;
            /**点击其他地方时，清除*/
            document.addEventListener('mousedown', function (event) {
                that.lastClick = event.target
            })
        }
        return init;
    }

    var document = window.document, noop = function () { },
        DeepElement = initFunction(),
        prototype = DeepElement.prototype;
    prototype.getUniqueId = function (element, parent) {
        element = element ? element : this.lastClick;
        if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) {
            console.warn("element is not a HTMLElement and SVGElement");
            return {};
        }

        if (this.resultsMap) {
            let result = this.resultsMap.get(element);
            if (result) return result;
        }

        var coords = getCoords(element);
        var result = {
            uniqueId: "",
            xPath: readXPath(element),
            top: coords.top,
            left: coords.left,
            viewLeft: element.getBoundingClientRect().left,
            viewTop: element.getBoundingClientRect().top,
            text: element.innerText
        },
            //construct data info of the element
            id = element.id,
            name = element.name,
            tag = element.tagName.toLowerCase(),
            className = "",
            classList = element.classList || [];
        classList.forEach(function (item) {
            className += "." + item;
        })
        if (tag === "body" || tag === "html") {
            result.uniqueId = tag;
        }
        //location by id
        if (id && document.getElementById(id) === element) {
            var regExp = new RegExp("^[a-zA-Z]+");
            /**当不为parent定位，且设置为简单结果时，直接返回id 否则使用完整路径标识符。注：两个if顺序不能更换，递归调用时 simpleId为undefined*/
            if (!parent) {
                result.uniqueId = "#" + id;
            }
            /*如果为parent定位，或者设置为完整结果时候，返回tag#id*/
            else if (regExp.test(id)) {
                result.uniqueId = tag + "#" + id
            }
        }
        //location by name
        if (!result.uniqueId && name && document.querySelector(tag + '[name="' + name + '"]') === element) {
            result.uniqueId = tag + '[name="' + name + '"]';
        }
        //location by class
        if (!result.uniqueId && className && document.querySelector(tag + className) === element) {
            result.uniqueId = tag + className;
            var classLength = classList.length
            if (classLength > 2) {
                var n = 1,
                    /**使用class查询的个数，如2，4，8：使用2，4，8个className做查询*/
                    queryCount = []
                while (Math.pow(2, n) < classLength) {
                    queryCount.push(Math.pow(2, n));
                    n++;
                }
                queryCount.push(classLength)

                for (var k = 0; k < queryCount.length; k++) {
                    /**使用class个数去查询*/
                    var countNum = queryCount[k];
                    //TODO 性能优化
                }
            }
        }
        var queryString = '';
        //location by mixed,order
        if (!result.uniqueId) {
            queryString = tag;
            queryString = className ? queryString + className : queryString
            queryString = name ? queryString + "[name='" + name + "']" : queryString
            if (prototype.getTarget(queryString) === element) {
                result.uniqueId = queryString
            }
        }
        //location by order
        if (!result.uniqueId) {
            queryString = tag
            queryString = className ? queryString + className : queryString

            var elements = document.querySelectorAll(queryString)
            if (elements && elements.length > 0) {
                var index = null, i;
                for (i = 0; i < elements.length; i++) {
                    if (element === elements[i]) {
                        index = i + 1;
                        break;
                    }
                }
                if (index) {
                    queryString = queryString + ":nth-child(" + index + ")"
                    if (document.querySelector(queryString) === element) {
                        result.uniqueId = queryString
                    }
                }
            }
        }
        //location by parent
        if (!result.uniqueId) {
            if (!element.parentNode) {
                return
            }
            var parentQueryResult = DeepElement.prototype.getUniqueId(element.parentNode, true),
                parentQueryString = parentQueryResult ? parentQueryResult.uniqueId : "";
            if (!parentQueryString) {
                return {
                    uniqueId: ""
                };
            }
            var targetQuery = tag;
            if (className) {
                targetQuery += className;
            }
            queryString = parentQueryString + ">" + targetQuery
            var queryElements = document.querySelectorAll(queryString);
            if (queryElements.length > 1) {
                queryString = null;
                var index = null;
                for (var j = 0; j < element.parentNode.children.length; j++) {
                    if (element.parentNode.children[j] === element) {
                        index = j + 1;
                        break;
                    }
                }
                if (index >= 1) {
                    queryString = parentQueryString + ">" + targetQuery + ":nth-child(" + index + ")";
                    var queryTarget = document.querySelector(queryString);
                    if (queryTarget != element) {
                        queryString = null;
                    }
                }
            }
            result.uniqueId = queryString
        }

        this.focusedElement = prototype.getTarget(result.uniqueId);

        if (this.resultsMap) {
            this.resultsMap.set(element, result);
        }

        return result
    }
    prototype.getTarget = function (queryString) {
        return document.getElementById(queryString) || document.getElementsByName(queryString)[0] || document.querySelector(queryString);
    }

    return new DeepElement();
}

var deepElement = getDeepElement();

/**
 * 获取点击的元素 
 * @param {Function} callback 
 * @param {String} mouseType 可选,默认 mousedown
 * @param {HTMLElement} element 可选, 默认 document
 * @return {Array} result, event
 * result: {uniqueId:'路径',xPath,text:'innerText',top,left,viewTop,viewLeft} 
 * event: 点击的元素
 */
var ElementSelected = function (callback, mouseType, element) {
    element = element || document;
    mouseType = mouseType || 'mousedown';
    document.addEventListener(mouseType, function (event) {
        var result = deepElement.getUniqueId(event.target);
        if (typeof callback === 'function') {
            callback(result, event);
        }
    }, false)
}

ElementSelected.getElementByXPath = function (STR_XPATH) {
    var xresult = document.evaluate(STR_XPATH, document, null, XPathResult.ANY_TYPE, null);
    var xnodes = [];
    var xres;
    while (xres = xresult.iterateNext()) {
        xnodes.push(xres);
    }
    return xnodes;
}

if (typeof (module) !== "undefined" && module.exports) {
    module.exports = ElementSelected;
} else if (window) {
    window.ElementSelected = ElementSelected;
}