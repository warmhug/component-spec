/****************************************************
* author：  hualei
* time：    2013/5/29 17:23:51
* fileName：panel.js
*****************************************************/

this.Panel = this.c_manager.defineComponent(Pa, Comm, Url);
function Pa() {

    this.defaultAttrs({
        btnSelector: '.btn',
        disSelector: '.dis',
        selectedClass: 'selected'
    })

    //this.on = 'on' // 重写on方法，抛错

    this.btnClick = function (e) {
        this.select('btnSelector').toggleClass(this.attr.selectedClass);

        //getDomain()为url.js中功能函数
        var domain = this.getDomain();

        //comm()为comm.js中功能函数
        this.comm();

        this.select('disSelector').html(domain);

        //触发一个接口事件
        this.trigger('Pa:getDomain', {
            val: domain
        })
    }

    this.after('initialize', function () {
        this.on('click', {
            btnSelector: this.btnClick
        });
        //this.on('', this.getDomain);
    })
}