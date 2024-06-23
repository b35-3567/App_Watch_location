import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Button, Text, StatusBar, TouchableOpacity,ScrollView,Modal,Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { API } from '../asm/API_TRUE'; // Đảm bảo đường dẫn đúng
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome';
import Geocoder from 'react-native-geocoding'
import { launchCamera,launchImageLibrary  } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
const GOOGLE_MAPS_APIKEY = 'AIzaSyAXVVX57lXbBHX8KWqqCPpo5HOQXhzx3kc';
Geocoder.init(GOOGLE_MAPS_APIKEY);
const GgMap = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [buttonTitle, setButtonTitle] = useState('Today');
  const [selectedCoordinate, setSelectedCoordinate] = useState(null); // State để lưu tọa độ marker được chọn
  const [selectedCoordinate1, setSelectedCoordinate1] = useState(null);
  const [address,setAddress]=useState(null);
  const [address1,setAddress1]=useState(null);
  const [imageLocal,setImageLocal] =useState('');
  const [modalVisiable,setModalVisiable]=useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  useEffect(() => {
    fetch(`http://${API}:3000/allDrivers`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        setDrivers(data);
        console.log('Drivers data:', data);
      })
      .catch(error => {
        console.error('Có lỗi khi lấy dữ liệu!', error);
      });
  }, []);

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
    fetch(`http://${API}:3000/drivers/${driver._id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        setRoutes(data.routes);
        console.log("routes", data.routes);
        filterRoutesByDate(data.routes, date);
      })
      .catch(error => {
        console.error('Có lỗi khi lấy dữ liệu tuyến đường!', error);
      });
  };

  const filterRoutesByDate = (routes, selectedDate) => {
    const filtered = routes.filter(route => {
      const routeDate = new Date(route.date);
      return routeDate.toDateString() === selectedDate.toDateString();
    });
    setFilteredRoutes(filtered);
  };

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    const formatted = `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
    setButtonTitle(formatted);
    setShow(false);
    setDate(currentDate);
    if (selectedDriver) {
      filterRoutesByDate(routes, currentDate);
    }
  };

  const showDatepicker = () => {
    setShow(true);
  };


  useEffect(() => {
    if (selectedCoordinate) {
      Geocoder.from(selectedCoordinate.latitude, selectedCoordinate.longitude)
        .then(json => {
          const addressComponent = json.results[0].formatted_address;
          setAddress(addressComponent);
        })
        .catch(error => console.warn(error));
    }
  }, [selectedCoordinate]);

  /////////
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
/////////////////////////////////////////////////
const getCurrentLocation = () => {
  Geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      setSelectedCoordinate1({ latitude, longitude });
      Geocoder.from(latitude, longitude)
        .then(json => {
          const addressComponent = json.results[0].formatted_address;
          setAddress1(addressComponent);
        })
        .catch(error => console.warn(error));
    },
    error => {
      console.log('Error getting current location:', error);
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
  );
};

  return (
    <ScrollView>
    <View style={ styles.container }>
      <StatusBar backgroundColor="#C3F4FD" barStyle="dark-content" />
      <View style={ { flexDirection: 'row', } }>
        <Icon name={ 'chevron-left' } size={ 24 } color="black" style={ { left: 12 } } />
        <View style={ { flex: 1 } } />
        <Text style={ { color: 'black', fontSize: 16, fontWeight: 500, alignItems: 'center' } }>Onfleet Drivers</Text>
        <View style={ { flex: 1 } } />
      </View>

      {/* <Button onPress={showDatepicker} title={buttonTitle} color="black"  /> */ }

      <TouchableOpacity onPress={ showDatepicker } style={ { width: 343, height: 50, backgroundColor: 'white', borderRadius: 20, left: 16, marginHorizontal: 16, top: 12 } }>
        <View style={ { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, alignItems: 'center', flex: 1 } }>
          <Text style={ { fontWeight: 400, fontSize: 16, color: 'black' } }>{ buttonTitle }</Text>
          <Icon name='chevron-down' size={ 16 } color='black' />
        </View>

      </TouchableOpacity>
      { show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={ date }
          mode="date"
          display="default"
          onChange={ onChange }
        />
      ) }
      <View style={ {
        width: 343,
        height: 400,
        borderRadius: 20,
        overflow: 'hidden',
        alignSelf: 'center',
        marginTop: 28,
      } }>
        <MapView
          style={ styles.map }
          initialRegion={ {
            latitude: 10.12344,
            longitude: 106.67889,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          } }
          showsUserLocation={ true }
          showsMyLocationButton={ true }
          zoomControlEnabled={ true }
          onPress={ (event) => {
            // Lấy tọa độ của marker được nhấn và lưu vào state
            setSelectedCoordinate(event.nativeEvent.coordinate);
          } }
        >
          { drivers.map(driver => (
            <Marker
              key={ driver._id }
              coordinate={ {
                latitude: driver.location.lat,
                longitude: driver.location.lng,
              } }
              onPress={ () => handleDriverSelect(driver) }
              title={ driver.name }
              pinColor="#80CC39"
            />
          )) }

          { filteredRoutes.map((route, routeIndex) => (
            <React.Fragment key={ routeIndex }>
              <MapViewDirections
                origin={ {
                  latitude: route.path[0].lat,
                  longitude: route.path[0].lng,
                } }
                destination={ {
                  latitude: route.path[route.path.length - 1].lat,
                  longitude: route.path[route.path.length - 1].lng,
                } }
                waypoints={ route.path.slice(1, -1).map(coord => ({
                  latitude: coord.lat,
                  longitude: coord.lng,
                })) }
                apikey={ GOOGLE_MAPS_APIKEY }
                strokeWidth={ 3 }
                strokeColor="hotpink"
              />
              { route.path.map((coord, coordIndex) => (
                <Marker
                  key={ `${routeIndex}-${coordIndex}` }
                  coordinate={ {
                    latitude: coord.lat,
                    longitude: coord.lng,
                  } }
                  title={ `Point ${coordIndex + 1}` }
                  pinColor="#8D5CE9"
                />
              )) }
            </React.Fragment>
          )) }

          {/* Hiển thị tọa độ của marker được chọn */ }
          { selectedCoordinate && (
            <Marker
              coordinate={ selectedCoordinate }
              title={ `Selected Coordinate` }
              pinColor="red"
            />
          ) }
        </MapView>


      </View>

      <View>
        <View style={ { flexDirection: 'row',marginTop:19,justifyContent:"space-between", alignItems: 'center', borderTopWidth:1 ,borderTopColor:'gray',paddingHorizontal:5,width:342,height:50,flex:1,alignSelf:'center'} }>
        <Icon name="map-marker" size={30} color="red" />
            {/* Hiển thị tọa độ của marker được chọn */ }
      {selectedCoordinate && (
        <View style={styles.coordinateContainer}>
          <Text style={styles.coordinateText}>
            Selected Coordinate: {selectedCoordinate.latitude.toFixed(6)}, {selectedCoordinate.longitude.toFixed(6)}
          </Text>
          {address && (
            <Text style={styles.addressText}>
              Address: {address}
            </Text>
          )}
        </View>
      )} 
        </View>
      </View>

<View style={{width:343,height:226,backgroundColor:'red'}}>
 {
  imageLocal !==''&&
  <Image
  source={{uri:imageLocal}}
  style={{width:200,height:200}}/>
 
 }
</View>


{/* hiển thị hình ảnh chổ này */}
<Modal
 animationType='slide'
 transparent={true}
 visible={modalVisiable}
 onRequestClose={()=>{
  setModalVisiable(!modalVisiable)
 }}
>
<View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Proof of Delivery</Text>
            <TouchableOpacity style={styles.modalButton} >
              <Text style={styles.modalButtonText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={takePhoto}>
              <Text style={styles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: 'red' }]} onPress={() => setModalVisiable(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
</Modal>

      <TouchableOpacity style={{marginTop:13,width:342,height:40,backgroundColor:"#01428E",flex:1,alignSelf:'center',justifyContent:'center',alignItems:'center',borderRadius:30,
       
      }}
      onPress={() => setModalVisiable(true)}
      >
            <Text style={{color:'white',fontSize:12,fontWeight:700}}>Proof of Delivery</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{marginTop:13,width:342,height:40,backgroundColor:"#01428E",flex:1,alignSelf:'center',justifyContent:'center',alignItems:'center',borderRadius:30,}}
       onPress={getCurrentLocation}> 
            <Text style={{color:'white',fontSize:12,fontWeight:700}}>Vị trí hiện tại cảu tôi</Text>
      </TouchableOpacity>
      <Text>hhhh</Text>
 {/* Display current location */}
 {selectedCoordinate1 && (
        <View style={styles.coordinateContainer}>
          <Text style={styles.coordinateText}>
            Selected Coordinate: {selectedCoordinate1.latitude.toFixed(6)}, {selectedCoordinate1.longitude.toFixed(6)}
          </Text>
          {address && (
            <Text style={styles.addressText}>
              Address: {address}
            </Text>
          )}
        </View>
      )} 
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // container: {
  //  flex: 1,
  // },
  // map: {
  // flex: 1,
  // },
  container: {
    flex: 1,
    backgroundColor: '#e6f9fd',

  },
  map: {
    // width: 343,
    // height: 400,
    // alignItems:'center',
    ...StyleSheet.absoluteFillObject, // Đảm bảo MapView lấp đầy View bao quanh
  },
  coordinateContainer: {
    //position: 'absolute',
    // bottom: 16,
    // left: 16,
    //backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 8,
  },
  coordinateText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#01428E',
    width: 200,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default GgMap;




/*
import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

const origin = { latitude: 10.8478544, longitude: 106.7195343 };
const destination = { latitude: 10.8508326, longitude: 106.7721334 }; // Example destination coordinates

const GOOGLE_MAPS_APIKEY = 'AIzaSyAXVVX57lXbBHX8KWqqCPpo5HOQXhzx3kc';

const GgMap = () => {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        <Marker coordinate={origin} title="Origin" />
        <Marker coordinate={destination} title="Destination" />

        <MapViewDirections
          origin={origin}
          destination={destination}
          apikey={GOOGLE_MAPS_APIKEY}
          strokeWidth={3}
          strokeColor="hotpink"
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default GgMap;
*/