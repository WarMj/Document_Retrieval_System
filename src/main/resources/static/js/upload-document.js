const tag_display_number = 7; // 默认显示几个标签

// 全局变量
var fileBoxTitle; // 文档集标题
var fileBoxDesc; // 文档集描述
var fileBoxCount; // 文档数量
var fileBoxPath; // 文档集路径

var fileName; // 文件名
var filePath; // 文件路径
var fileType; // 文件类型
var fileOrder = 0; // 文件序号
var fileBoxId; // 文档集id

var files = []; // 上传文件列表 页面使用
var filesUpload = []; // 上传文件列表 后端使用

var tags_data; // 标签数据
var tags_selected = new Set(); // 已选择的标签

var form = layui.form; // 表单数据

// form.verify({
//     file_name : [
//         /^[\S]{1,40}$/
//         ,'文件名字小于40个字，且不能出现空格'
//     ]
// });

// 选择和上传每个文件 （点击确认录入按钮）
var $ = layui.jquery
    , upload = layui.upload;
var uploadListView = $('#upload-list')
    , uploadListIns = upload.render({
    elem: '#choose-btn' // 选择文件按钮
    , url: '/file/upload' // 上传文件接口
    , accept: 'file'
    , exts: '' //允许上传的文件类型
    , multiple: true // 是否允许多文件上传。
    , auto: false
    , bindAction: '#upload-btn' // 确认录入按钮
    , choose: function (obj) { // 	选择文件后的回调函数。返回一个object参数，
        this.files = obj.pushFile(); // 将每次选择的文件追加到文件队列
        //读取本地文件
        obj.preview(function (index, file, result) {
            var tr = $(['<tr id="upload-' + index + '">'
                , '<td>' + index + '</td>'
                , '<td>' + file.name + '</td>'
                , '<td>' + (file.size / 1024).toFixed(1) + 'kb</td>'
                , '<td>等待上传</td>'
                , '<td>'
                , '<button class="layui-btn layui-btn-xs demo-reload layui-hide">重传</button>'
                , '<button class="layui-btn layui-btn-xs layui-btn-danger demo-delete">删除</button>'
                , '</td>'
                , '</tr>'].join(''));
            //单个重传
            tr.find('.demo-reload').on('click', function () {
                obj.upload(index, file);
            });

            //删除
            tr.find('.demo-delete').on('click', function () {
                delete files[index]; //删除对应的文件
                tr.remove();
                changeFileOrder();
                uploadListIns.config.elem.next()[0].value = ''; //清空 input file 值，以免删除后出现同名文件不可选
            });

            uploadListView.append(tr);
            changeFileOrder(); // 更改文件序号
        });
    }
    , before: function(obj){ //obj参数包含的信息，跟 choose回调完全一致，可参见上文。
        // console.log("正在上传");
    }
    , done: function (res, index, upload) {
        console.log(index);
        // 文件上传成功
        if (res.code === 0) {
            //获取文件名，不带后缀
            var fileName = res.data.fileUrl.replace(/(.*\/)*([^.]+).*/ig,"$2");

            //获取文件后缀
            var type = res.data.fileUrl.replace(/.+\./,"");

            filesUpload.push({"fileName": fileName, "numberOrder": 0, "path": res.data.fileUrl, "type": type});
            files.push({"fileUrl": res.data.fileUrl, "fileSize": res.fileSize}); // "fileUrl":res.fileUrl
            var json = JSON.stringify(files);
            //将上传的文件信息加入到集合中并转换成json字符串
            $("#fileJson").attr("value", json);

            var fileUrl = res.data.fileUrl;
            fileBoxPath = res.data.fileBoxPath;
            var tr = uploadListView.find('tr#upload-' + index)
                , tds = tr.children();
            tds.eq(2).html('<span style="color: #5FB878;">上传成功</span>');
            tds.eq(3).html('<span>' + fileUrl + '</span>');
            tds.eq(4).html(''); //清空操作
            return delete this.files[index]; //删除文件队列已经上传成功的文件
        }
        this.error(index, upload);
    }
    , allDone: function (obj) { //当文件全部被提交后，才触发
        if (obj.aborted === 0) {
            // 所有文件上传成功
            uploadFileBox(); // 所有文件上传之后，录入fileBox
        } else {
            layer.msg('录入失败', {icon: 2});
        }
        setTimeout(function() { location.reload(); }, 3000);
    }
    , error: function (index, upload) {
        var tr = uploadListView.find('tr#upload-' + index)
            , tds = tr.children();
        tds.eq(2).html('<span style="color: #FF5722;">上传失败</span>');
        tds.eq(3).find('.demo-reload').removeClass('layui-hide'); //显示重传
    }
});

// 开始录入
function uploadFileBox() {
    // 检查文件数据
    if (!checkFileBox()) {
        return;
    }

    fileBoxTitle = $('#title-input')[0].value;
    fileBoxDesc = $('#desc-input')[0].value;

    // 修改文件序号
    for (var i = 0; i < filesUpload.length; i++) {
        filesUpload[i].numberOrder = i + 1;
    }

// 上传fileBox
    $.ajax({
        url: "/fileBox/",
        type: 'POST', //请求方法，GET、POST、PUT、DELETE在这里设置
        timeout: 5000, //超时时间
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            "title": fileBoxTitle,
            "desc": fileBoxDesc,
            "count": fileBoxCount,
            "tags": Array.from(tags_selected),
            "files": filesUpload
        }),
        success: function (data, textStatus, jqXHR) {
            console.log(data);
            layer.msg('录入成功', {icon: 1});
        },
        error: function (xhr, textStatus) {
            console.log(textStatus);
            layer.msg('录入失败', {icon: 2});
        }
    })
}

// 监听标签复选框点击
form.on('checkbox(tag_selected)', function(data){
    if (data.elem.checked) {
        tags_selected.add(data.value);
    } else {
        tags_selected.delete(data.value);
    }
    console.log(tags_selected);
});

// 加载标签数据
$.ajax({
    url: '/tag/', // 请求的URL地址
    type: 'GET', // 请求方法，GET、POST、PUT、DELETE在这里设置
    timeout: 5000,    // 超时时间
    dataType: 'json',    // 返回的数据格式：json/xml/html/script/jsonp/text
    success: function (data, textStatus, jqXHR) {    // 成功的回调函数
        tags_data = new Map();

        // 规定待选标签的数量，优化布局
        var block_num = data.data.length < tag_display_number ? data.data.length : tag_display_number;

        for (var o of data.data) {
            if (block_num > 0) {
                var $input = $("<input type='checkbox' lay-filter='tag_selected' value=" + o.id + " title=" + o.name + ">");
                $('#tag-block').append($input);
                tags_data.set(o.id, o.name);
            }

            if (block_num <= 0) {
                // 将剩下的tag添加到下拉列表中
                var $option = $("<option value=" + o.id + ">" + o.name + "</option>");
                $('#tag-search').append($option);
                tags_data.set(o.id, o.name);
            }
            block_num--;
        }

        // 更新select列表和block
        form.render();
    },
    error: function (xhr, textStatus) { // 失败的回调函数
        console.log(textStatus);
    }
});

// 将选中的tag放到左边待选标签中
form.on('select(tag-search)', function (data) {
    appendTagsSelect(tags_data.get(parseInt(data.value)), data.value);
});

// 录入前检查 文件
function checkFileBox() {
    fileBoxCount = document.getElementById("upload-list").rows.length - 1; // 文件数量

    // 检查是否有文件
    if (fileBoxCount === 0) {
        layer.msg('没有选择文件', {icon: 5, anim: 6});
        return false;
    }
    return true;
}

// 更改文件序号
function changeFileOrder() {
    var count = document.getElementById("upload-list").rows.length;
    console.log("count = " + count);
    for (var i = 0; i < count; i++) {
        $("#upload-list > tbody > tr:eq(" + i + ")>td:eq(0)").html(i + 1);
    }
}

// 新建标签
function createTag() {
    var newTagName = $("input:last").val();
    var newTagId = 0;
    var isDuplicate = false;

    tags_data.forEach(function(value, key) {
        // 重复标签
        if (newTagName === value) {
            layer.msg('已存在此标签，请直接选择', {icon: 2});
            isDuplicate = true;
        }
    });

    if (!isDuplicate) {
        // 新建标签
        $.ajax({
            url: "/tag/",
            type: 'POST', //请求方法，GET、POST、PUT、DELETE在这里设置
            timeout: 5000, //超时时间
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({
                "name": newTagName,
            }),
            success: function (data, textStatus, jqXHR) {
                layer.msg(newTagName + ' 标签新建成功', {icon: 1});
                newTagId = data.data.id + '';
                // 添加到左侧待选标签中
                appendTagsSelect(newTagName, newTagId);
            },
            error: function (xhr, textStatus) {
                console.log(textStatus);
            }
        });
    }
}

// 添加到左侧待选标签中
function appendTagsSelect(tagName, tagId) {
    if (tagName === "") return; // 忽略空值
    var $input = $("<input type='checkbox' checked lay-filter='tag_selected' value=" + tagId + " title=" + tagName + ">");
    $('#tag-block').append($input);

    // 从select列表中移除已选中的tag
    $('option').remove("[value=" + tagId + "]");

    // 将id添加到set集合中
    tags_selected.add(tagId);

    form.render();
}