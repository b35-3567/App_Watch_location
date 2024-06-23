import { View, Text, Button,Image } from 'react-native'
import React,{useState} from 'react'
import { launchCamera,launchImageLibrary  } from 'react-native-image-picker';


 
const Sc23_6 = () => {
    const [imageLocal,setImageLocal] =useState('');
    const takePhoto= ()=>{
        const options={
            mediaType:'photo',
            quality:1,
            cameraType:'front',
            saveToPhotos:true
        };
        try {
            launchCamera(options,async(response)=>{
                console.log('Response=',response);
                if(response.didCancel){
                    console.log('user cancelled photo picker')
                }else if(response.errorCode){
                    console.log('ImagePicker error:',response.errorMessage)
                }else{
                    console.log('response:',response)
                    const imageUri=response.assets[0].uri;
                    console.log('Image uri:',imageUri);
                     setImageLocal(imageUri);
                }
            })
        } catch (error) {
            console.log('error',error)
        }
    }
  return (
    <View>
        <Button 
        title='Take Photo'
        onPress={takePhoto}
        />
       {
        imageLocal !==''&&
        <Image 
        source={{uri:imageLocal}}
        style={{width:200,height:200}}/>
       }
    </View>
  )
}

export default Sc23_6