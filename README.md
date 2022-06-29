# Daemon Camera Raspberry-Pi

Set up video surveillance from the nursery
Road map : Add OpenCV object detection


## Dependencies

**express**<br>**raspberry-pi-camera-native**

### Route
|| Route            | Action                |
|------------------|-----------------------|-----------------------------|
| `stream`         | Camera stream         |
| `take/:nameFile` | Save image            |
| `list`           | List of files in JSON |
| `get/:nameFile`  | GET image             |
