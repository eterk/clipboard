# Eagle Clipboard Plugin

The Eagle Clipboard Plugin is a powerful tool designed to enhance your note-taking experience. It allows you to take multiple screenshots, stitch them together into a single image, and save it in Eagle for future reference. This plugin is particularly useful for personal note-taking, documentation, and any scenario where visual aids can enhance understanding and recall.

## Features

- **Multiple Screenshots**: The plugin allows you to take multiple screenshots and stores them temporarily.
- **Image Stitching**: It can stitch multiple screenshots together into a single image.
- **Save to Eagle**: The stitched image can be saved directly into Eagle, a versatile digital asset management software.
- **Custom Annotations**: You can add custom annotations, tags, and website links to the saved image for better organization and searchability.

## How to Use

1. **Take a Screenshot**: Click the "截图" button to take a screenshot. The screenshot will be added to the 'pictures' section.
2. **Save the Image**: Click the "保存" button to stitch all the screenshots in the 'pictures' section together and save the resulting image in Eagle.
3. **Clear All**: Click the "清理" button to remove all screenshots from the 'pictures' section.
4. **Close the Plugin**: Click the "关闭" button to close the plugin.

## Customization

You can customize the saved image's metadata:

- **文件名**: Set the filename of the saved image.
- **添加注释**: Add custom annotations to the saved image.
- **http://**: Attach a relevant website link to the saved image.
- **标签之间用','分割**: Add tags to the saved image for better organization. Separate multiple tags with commas.

## Code Overview

The plugin is built with HTML, CSS, and JavaScript. It uses the `html2canvas` library to take screenshots and the `path` and `child_process` modules of Node.js for file handling and executing shell commands.

## Contribution

Feel free to fork the project, open issues, or submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contact

For any questions, feel free to reach out to the developer at moshenwuji@live.com or visit the [GitHub](https://github.com/eterk) page.