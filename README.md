# 新组件规范-demo #

- 统一配置组件参数：this.defaultAttrs({ arg:'a'... })   
- 统一容器元素（不用再手工获取引用）:this.$node | this.node
- 统一事件管理（不用手工写销毁事件代码）: teardown | teardownAll ，为后续多webapp融合提供便捷方法
- 不存在私有函数，配置项隔离，为后续单元测试提供方便  

<pre>
this.defaultAttrs({