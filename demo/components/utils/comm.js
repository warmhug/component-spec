/****************************************************
* author：  hualei
* time：    2013/5/29 17:25:43
* fileName：comm.js
*****************************************************/

function Comm() {
    this.comm = function () {
        console.log('this is comm method, from comm util file')
    }
    //this.on = 'on' // 重写on方法，抛错
}