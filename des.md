
- 参考readme
- 大概看了kissy组件组织方式：可选继承base.js或rich-base.js，为组件提供get set等方法；但kissy组件又依赖了kissy核心，所以离开核心，kissy组件一样运行不了，有些不伦不类了。
- 组件管理器提供set get方法（类似kissy的base.js里提供对一些配置项进行读取和设置的功能）。  
- 组件严重依赖组件管理器，是否提供去组件管理器方案？（例如kissy组件很丰富，但严重依赖kissy核心，其组件需要改动很多才能应用到jquery angular等其他核心）  