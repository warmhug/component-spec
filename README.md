# 新组件规范-demo #主文件：new \ lib \ c_manager.js## change logs ##- 支持普通的事件委托方式，this.on('click', '.next', Func);
## 优势： ##
- 统一配置组件参数：this.defaultAttrs({ arg:'a'... })   
- 统一容器元素（不用再手工获取引用）:this.$node | this.node
- 统一事件管理（不用手工写销毁事件代码）: teardown | teardownAll ，为后续多webapp融合提供便捷方法
- 不存在私有函数，配置项隔离，为后续单元测试提供方便  
## 使用组件时： ##1、生成组件实例，例：var pg = new PageNav('#page')。   2、绑定组件接口名，在事件handler中写业务逻辑，例：pg.on('P:switchPage', function (e, page) { //这里写业务逻辑 })**tip：**注意绑定到dom上的自定义事件，其原型与浏览器原生事件原型一致，创建于document.createEvent，所以在document上或父容器元素上绑定组件的自定义事件，利用事件冒泡特性处理业务逻辑，来应用于多组件共用的事件处理函数，是可行且相对优异的方案。（详情参考jquery或zepto的on方法）## 主要api： ##**on ， off ， trigger** -- 在zepto已有方法上做扩展，把事件记录起来，统一做检查销毁等处理。   **this.defaultAttrs** -- 组件元素，前者经zepto包装，后者指原生dom。    **select** -- 代理zepto的find方法，在组件容器内查找元素；e.g. this.select('#id').  **teardown** -- 用于组件事件和实例的销毁，在实例级别调用，例如pg组件实例，**pg.teardown()**  **teardownAll** -- 销毁，用于组件类级别和页面中所有组件级别，例：**PageNav.teardownAll()**能销毁页面中有所PageNav类生成的所有实例；  **window.c_manager.defineComponent.teardownAll()**能销毁所有类及其生成的所有实例。    以上api在 **使用或开发** 组件时都可以用到，以下api一般在开发组件时使用**after，before，around** -- 在某个函数执行之后、之前、或wrap到某个函数上执行。例：this.after('initialize', function () {})，在组件管理器中的‘initialize’方法执行后执行，用在业务组件初始化时，即组件管理器ready后可以执行自己开发的组件里的方法。  **this.defaultAttrs(attrObj)** -- 直接调用，传入配置参数对象，最终在实例上生成了attr属性，引用合并后的参数对象。例如：
<pre>
this.defaultAttrs({    btnSelector: '.btn',    disSelector: '.dis',    selectedClass: 'selected'})</pre>## 开发组件时： ##1、组件接口尽量全部以事件形式提供（即trigger一个自定义事件名）  2、组件方法名要规范，例如方法名前推荐写代表组件的前缀，私有方法前加下划线'_'；接口名加前缀，例如'P:switchPage'  3、组件中事件绑定部分，要统一用this.on()，以便组件管理器记录起来统一管理事件销毁**注意点**：    为了防止组件提供的管理方法被用户写的组件代码覆盖，对组件compose部分代码进行hack修补。当控制台抛出错误“the property of [xx] in [yy] class is a keyword and can't be rewritten.”请检查修改xx属性；    避免直接this.xx的关键词列出如下："initialize", mixedIn", "trigger", "on", "off", "defaultAttrs", "select","teardown", "before", "after", "around"