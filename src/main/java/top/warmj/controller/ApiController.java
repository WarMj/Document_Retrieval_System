package top.warmj.controller;

import com.alibaba.fastjson.JSONObject;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.URL;
import java.net.URLConnection;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin
@RequestMapping("/api")
public class ApiController {
    @ResponseBody
    @RequestMapping(value = "/cors", method = RequestMethod.POST, consumes="application/json")
    public JSONObject sendGet(@RequestBody String body, HttpServletRequest request) {
        //解析json
        JSONObject paramterJson = JSONObject.parseObject(body);
        String dest_url = paramterJson.getString("dest_url");
        String dest_body = paramterJson.getString("dest_body");

        String result = "";
        BufferedReader in = null;
        try {
            String urlNameString = dest_url;
            URL realUrl = new URL(urlNameString);
            // 打开和URL之间的连接
            URLConnection connection = realUrl.openConnection();
            // 设置通用的请求属性
            connection.setReadTimeout(1000 * 3000);//设置超时时间（测试接口所以时间长一些）
            connection.setRequestProperty("accept", "*/*");
            connection.setRequestProperty("connection", "Keep-Alive");
            connection.setRequestProperty("user-agent",
                    "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1;SV1)");
            connection.setDoOutput(true);
            // 建立实际的连接
            connection.connect();

            if (!ObjectUtils.isEmpty(dest_body)) {
                //write body
                try (PrintWriter writer = new PrintWriter(connection.getOutputStream())) {
                    writer.write(dest_body);
                    writer.flush();
                }
            }

            // 获取所有响应头字段
            Map<String, List<String>> map = connection.getHeaderFields();
            // 遍历所有的响应头字段
            for (String key : map.keySet()) {
                System.out.println(key + "--->" + map.get(key));
            }
            // 定义 BufferedReader输入流来读取URL的响应
            in = new BufferedReader(new InputStreamReader(
                    connection.getInputStream()));
            String line;
            while ((line = in.readLine()) != null) {
                result += line;
            }
        } catch (Exception e) {
            System.err.println("发送GET请求出现异常:" + e);
            e.printStackTrace();
        }
        // 使用finally块来关闭输入流
        finally {
            try {
                if (in != null) {
                    in.close();
                }
            } catch (Exception e2) {
                e2.printStackTrace();
            }
        }
        return JSONObject.parseObject(result);
    }
}
