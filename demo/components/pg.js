/****************************************************
* author：  hualei
* time：    2013/5/16 14:59:13
* fileName：btn.js
*****************************************************/


this.Pg = this.c_manager.defineComponent(PageNav);

function PageNav() {
    //配置默认选项
    this.defaultAttrs({
        preBtn: '.c-p-pre',
        nextBtn: '.c-p-next',
        //以下正常配置
        'index': 1,
        'pageCount': '',		//没总页数，表示翻页才能确定是否存在下一页
        'preFix': '!page/',	//单页面单控件显示'Z'
        'objId': 'Z',			//hash格式
        'disableHash': '',	//hash不变功能支持
        oldIndex: -1
    })
    //修正选项
    this._pg_updateOptions = function () {

        var preFix = this.attr.preFix, length = preFix.length;
        if (preFix.charAt(length - 1) != '/') preFix += '/';

        var index = this.attr.index;
        var pageCount = this.attr.pageCount;
        !this.pageCount && (this.attr.disableHash = true);   //总页数未知，则不支持hash
        (isNaN(index) || index <= 0) && (index = 1);
        pageCount && index > pageCount && (index = pageCount);

    }
    this._pg_createDom = function () {
        var _self = this,
        $container = _self.$node,
        count = _self.attr.pageCount,
        arrow = count && '<i class="aw a-d"></i>' || '',
        selecte = count && '<select class="c-p-select"></select>' || '',
        htmlArr = [
            '<section class="c-p-con">',
                '<a class="c-btn c-btn-100 c-p-pre">上一页</a>',
                    '<div class="c-p-cur">',
                        '<div class="c-p-arrow">',
                            '<span></span>',
                            arrow,
                        '</div>',
                        selecte,
                    '</div>',
                '<a class="c-btn c-btn-100 c-p-next">下一页</a>',
            '</section>'
        ];
        $container.html(htmlArr.join(''));
        if (!count) return;  //总页数未知则不支持跳页
        selecte = _self.attr.$select || (_self.attr.$select = $container.find('select'));
        //selecte.empty();
        htmlArr = new Array(count);
        for (var index = 1; index <= count; index++) {
            htmlArr[index - 1] = '<option>第' + index + '页</option>';
        }
        selecte.append(htmlArr.join(''));
    }
    this._pg_renderPage = function (param) {
        var _self = this.attr,
        $container = this.$node,
        $select = _self.$select,
        pageCount = _self.pageCount,
        _index = _self.index,
        $lastPage = $('.c-p-pre', $container),
        $nextPage = $('.c-p-next', $container);
        if (pageCount) {
            if (pageCount <= 1) {
                $lastPage.addClass('c-btn-off');
                $nextPage.addClass('c-btn-off');
                _self.pageCount = 1;
            }
            else {
                if (_index == 1) {
                    $lastPage.addClass('c-btn-off');
                    if (pageCount > 1) {
                        $nextPage.removeClass('c-btn-off');
                    }
                }
                else if (_index == pageCount) {
                    $nextPage.addClass('c-btn-off');
                    if (pageCount > 1) {
                        $lastPage.removeClass('c-btn-off');
                    }
                }
                else {
                    if (_index > 1 && _index < pageCount) {
                        $lastPage.removeClass('c-btn-off');
                        $nextPage.removeClass('c-btn-off');
                    }
                }
            }
            $select && ($select.get(0).selectedIndex = _index - 1)
        }
        else {
            if (param == 'end') {  //翻到底则不走这个逻辑了
                _index--;
                $nextPage.addClass('c-btn-off');
                _self.pageCount = _self.index = _index;
            }
            if (_index <= 1) $lastPage.addClass('c-btn-off');
            else $lastPage.removeClass('c-btn-off');
        }
        var pageText = _index + '/' + pageCount;
        if (!$select) pageText = '第 ' + _index + ' 页';
        $('.c-p-arrow span', $container).text(pageText);

    }
    this._pg_eventAttach = function () {
        var _self = this,
        $container = _self.$node,
        $select = _self.attr.$select,
        $arrow = _self.attr.$arrow || (_self.attr.$arrow = $('.c-p-arrow i', _self.$node));
        commonFunc = function (e) {
            _self._pg_triggerEvent(e);
        };
        if ($select) {
            //$select.on({
            //    'mousedown': function (e) {
            //        $arrow.addClass('a-u');
            //    },
            //    'blur': function (e) {
            //        $arrow.removeClass('a-u');
            //    },
            //    'change': commonFunc
            //});

            //this.on($select, 'mousedown', function (e) { $arrow.addClass('a-u'); })
            //this.on($select, 'blur', function (e) { $arrow.removeClass('a-u'); })
            //this.on($select, 'change', commonFunc)

        }
        //$container.on('click', '.c-p-pre', commonFunc);
        //$container.on('click', '.c-p-next', commonFunc);

        //this.on(this.$node.find('.c-p-pre'), 'click', commonFunc);
        //this.on(this.$node.find('.c-p-next'), 'click', commonFunc);

        this.on('click', '.c-p-next', commonFunc);

        //this.on('click', {
        //    preBtn: commonFunc,
        //    nextBtn: commonFunc
        //});

    }

    this._pg_triggerEvent = function (e) {
        e.preventDefault();
        var _self = this,
        current = e.target,
        $current = $(current),
        tagName = current.tagName.toLowerCase(),
        _index = _self.attr.index,
        param = {};
        if (tagName == 'a') {
            if ($current.hasClass('c-btn-off')) return;
            var typebtn = '';
            if ($current.hasClass('c-p-pre')) {
                //_self.index--;
                _index--;
                typebtn = 'pre';
            }
            else if ($current.hasClass('c-p-next')) {
                //_self.index++;
                _index++;
                typebtn = 'next';
            }
        }
        else if (tagName == 'select') {
            //_self.index = $current.get(0).selectedIndex + 1;
            _index = current.selectedIndex + 1;
            if (_self.attr.oldIndex == _index) return;
            _self.attr.$arrow.removeClass('a-u');
            typebtn = 'select';
        }
        _self.attr.index = _index;
        param = {
            index: _index,
            type: typebtn
        }
        if (_self.attr.$select) {
            _self._pg_renderPage();
        }
        else {//总页数未知，需请求后执行回调
            param.callback = function (param) {
                _self._pg_renderPage(param);
            }
        }
        //console.log(_self.index);
        if (!_self.attr.disableHash) {
            _self._pg_changeHash();
        }
        else {
            _self.trigger('P:switchPage', param);
        }
        _self.attr.oldIndex = _index;
    }

    this._pg_parseHash = function () {
        //获取hash(一个页面多个分页控件)
        var _self = this,
            hashValue = location.hash,
            currHash = hashValue.substr(hashValue.lastIndexOf('/') + 1),
            hashArr = [],
            index = 0,
            mixArr = [];

        hashArr = currHash.split('-');

        for (var i = 0; i < hashArr.length; i++) {
            mixArr = hashArr[i].split('');
            var objId = mixArr.shift();
            if (objId == this.attr.objId) {
                index = Number(mixArr.join(''));
                if (isNaN(index) || index <= 0) {
                    _self.attr.index = 1;
                }
                if (index > _self.pageCount) {
                    _self.attr.index = _self.attr.pageCount;
                }

                _self.attr.index = index;
            }
        }
    }
    this._pg_changeHash = function () {
        var _self = this.attr,
            hashVal = location.hash;
        if (hashVal == '') {
            location.hash = _self.preFix + '-' + _self.objId + _self.index;
        }
        else {
            var begin = hashVal.lastIndexOf(_self.objId),
                end = begin;
            if (begin == -1) {
                location.hash += '-' + _self.objId + _self.index;
            }
            else {
                while (true) {
                    end++;
                    if (hashVal[end] == '-' || !hashVal[end]) break;
                }
                hashVal = hashVal.replace(hashVal.substring(begin, end), _self.objId + _self.index);
                location.hash = hashVal;
            }
        }
    }

    //供用户代码设置的方法
    this.pg_setIndex = function (pageIndex) {
        var _self = this.attr;
        if (!_self.$select) return;  //总页数未知不执行
        pageIndex = Number(pageIndex);
        if (isNaN(pageIndex)) {
            pageIndex = 1;
        }
        if (pageIndex > _self.pageCount) {
            pageIndex = _self.pageCount;
        }
        if (pageIndex <= 0) {
            pageIndex = 1;
        }
        _self.index = pageIndex;
        this._pg_renderPage();
    }
    this.pg_setCount = function (e, pageCount) {  //粗暴方法，使用后总页数和当前页数一致
        if (!pageCount) return;
        this.attr.pageCount = this.attr.index = pageCount;
        this._pg_renderPage();
    }
    this.pg_pContainer = function (e) {
        return this.$node;
        //Pg.dataNode.push(this.$node);
    }

    this.after('initialize', function () {

        this._pg_updateOptions();
        this._pg_createDom();
        this._pg_eventAttach();
        !this.attr.disableHash && this._pg_parseHash();
        this._pg_renderPage();

        //this.on(document, 'P:setCount', this.pg_setCount);
        this.on('P:setCount', this.pg_setCount);
        //this.on(document, 'P:getContainer', this.pg_pContainer);

    });

}

