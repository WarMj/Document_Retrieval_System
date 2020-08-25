package top.warmj.service;

import top.warmj.pojo.File;
import top.warmj.pojo.FileBox;

import java.util.List;

public interface FileBoxService {

    FileBox getFileBox(int id);

    List<FileBox> getAllFileBox();

    List<File> getFiles(int id);

    int postFileBox(FileBox fileBox);

    int deleteFileBox(int id);

    List<FileBox> getFileBoxByTitle(String title);
}
