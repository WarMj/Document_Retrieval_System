package top.warmj.controller;

import org.apache.ibatis.javassist.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import top.warmj.pojo.File;
import top.warmj.pojo.Result;
import top.warmj.service.FileService;

import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.LinkedList;
import java.util.List;

@RestController
@RequestMapping("/file")
public class FileController {
    @Autowired
    FileService fileService;

    /**
     * 根据id获取文件
     *
     * @param id
     * @return
     */
    @GetMapping("/{id}")
    public Result<List<File>> getFile(@PathVariable int id) {
        File file = fileService.getFile(id);
        if (file == null) {
            return new Result<>(new NotFoundException("错误，数据库中未查到相关资源"));
        } else {
            List<File> list = new LinkedList<>();
            list.add(file);
            return new Result<>(list);
        }
    }

    /**
     * 获取所有文件
     *
     * @return
     */
    @GetMapping({"/", ""})
    public Result<List<File>> getAllFile() {
        List<File> list = fileService.getAllFile();
        if (list.size() == 0) {
            return new Result<>(new NotFoundException("错误，数据库中未查到相关资源"));
        } else {
            return new Result<>(list);
        }
    }

    /**
     * 获取某个文档集中的所有文件
     *
     * @param id
     * @return
     */
    @GetMapping("/fileBox/{id}")
    public Result<List<File>> getFiles(@PathVariable int id) {
        List<File> list = fileService.getFiles(id);
        Result<List<File>> result = new Result<>(list);
        if (list.size() == 0) {
            return new Result<>(new NotFoundException("错误，数据库中未查到相关资源"));
        } else {
            return result;
        }
    }

    /**
     * 创建文件
     *
     * @param file
     * @return
     */
    @PostMapping({"/", ""})
    public Result<String> postFile(@RequestBody File file) {
        if (fileService.postFile(file) == 0) {
            return new Result<>(new NotFoundException("错误，添加失败"));
        } else {
            return new Result<>("添加成功");
        }
    }

    /**
     * 删除文件
     *
     * @param id
     * @return
     */
    @DeleteMapping("/{id}")
    public Result<String> deleteFile(@PathVariable int id) {
        if (fileService.deleteFile(id) == 0) {
            return new Result<>(new NotFoundException("错误，删除失败"));
        } else {
            return new Result<>("删除成功");
        }
    }

    /**
     * 上传文件
     *
     * @param file
     * @return
     */
    @PostMapping("/upload")
    public String uploadFile(@RequestParam("file") MultipartFile file) {
        System.out.println(file);
        String pathString = null;
        if (file != null) {
            //获取上传的文件名称
            String filename = file.getOriginalFilename();
            //文件上传时，chrome与IE/Edge对于originalFilename处理方式不同
            //chrome会获取到该文件的直接文件名称，IE/Edge会获取到文件上传时完整路径/文件名
            //Check for Unix-style path
            assert filename != null;
            int unixSep = filename.lastIndexOf('/');
            //Check for Windows-style path
            int winSep = filename.lastIndexOf('\\');
            //cut off at latest possible point
            int pos = (Math.max(winSep, unixSep));
            if (pos != -1) {
                filename = filename.substring(pos + 1);
            }
            // 路径
            pathString = "D:/upload/" + new SimpleDateFormat("yyyyMMddHHmmss").format(new Date()) + "_" + filename;//上传到本地
        }
        try {
            assert pathString != null;
            java.io.File files = new java.io.File(pathString); // 在内存中创建File文件映射对象
            //打印查看上传路径
            System.out.println(pathString);
            if (!files.getParentFile().exists()) { // 判断映射文件的父文件是否真实存在
                files.getParentFile().mkdirs(); // 创建所有父文件夹
            }
            file.transferTo(files); // 采用file.transferTo 来保存上传的文件
        } catch (Exception e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        return "{\"code\":0, \"msg\":\"success\", \"fileUrl\":\"" + pathString + "\"}";
    }

    /**
     * 下载某个文件
     *
     * @param id
     * @return
     */
    @GetMapping("/download/{id}")
    @CrossOrigin // 跨域访问
    public Result<String> downloadFileById(@PathVariable int id, HttpServletResponse response) {
        List<Integer> idList = new LinkedList<>();
        idList.add(id);

        List<File> filesResultList = fileService.getFilesByIdList(idList);

        if (filesResultList.isEmpty()) {
            return new Result<>(new FileNotFoundException("文件未找到"));
        }

        String url = filesResultList.get(0).getPath();
        String name = filesResultList.get(0).getFileName();
        String type = filesResultList.get(0).getType();

        // 检测文件是否存在
        java.io.File file = new java.io.File(url);
        if (!file.exists()) {
            return new Result<>(new FileNotFoundException("文件未找到"));
        }

        //接下来是构造头部包括名称和编码的操作
        response.reset();
        try {
            //使用注释掉的方法时中文名称会变为下划线，故要采用UTF8的编码方式
            response.addHeader("Content-Disposition", "attachment;filename=" + URLEncoder.encode(name + "." + type, "UTF-8"));
        } catch (UnsupportedEncodingException e) {
            return new Result<>(e);
        }

        response.setHeader("Access-Control-Allow-Origin", "*"); //跨越请求
        response.setContentType("application/force-download"); //下载
        response.setContentType("multipart/form-data");

        try {
            //接下来时构造下载流的常规操作，我也不懂，就照着写吧hhhh
            InputStream inStream = new FileInputStream(url);
            OutputStream os = response.getOutputStream();
            byte[] buff = new byte[1024];
            int len = -1;
            while ((len = inStream.read(buff)) > 0) {
                os.write(buff, 0, len);
            }
            os.flush();
            os.close();
            inStream.close();
        } catch (Exception e) {
            e.printStackTrace();
            return new Result<>(new FileNotFoundException("文件未找到"));
        }

        return null;
    }
}