import React from 'react';
import { NetInfo, Text, View, Image, StyleSheet, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { createStackNavigator } from 'react-navigation';
import MapView, { Marker, Callout } from 'react-native-maps';
import { fetchFromPublicApi, apikey } from 'testapp/utils/request';
import { Nav, container, imagewrap, imageitem } from './sharedstyles';
import { ImageDetails } from './image/imagedetails';
import { LogoTitle } from './logo';

class MapFeed extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isConnected: null,
      images: [],
      markers: [],
      loading: true,
      latitude: 55.405691,
      longitude: 10.3860423,
    };

    this._fetchImages = this._fetchImages.bind(this);
    this._fetchInfoForImg = this._fetchInfoForImg.bind(this);

  }

  componentDidMount() {
    //check for internet connection
    NetInfo.isConnected.addEventListener(
      'connectionChange',
      this._handleConnectivityChange
    );
    NetInfo.isConnected.fetch().done(
      (isConnected) => { this.setState({ isConnected }); }
    );

    this._fetchImages();

  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener(
      'connectionChange',
      this._handleConnectivityChange
    );
  }

  _handleConnectivityChange = (isConnected) => {
    this.setState({
      isConnected,
    });
  }

  _fetchImages() {
    this.setState({ loading: true, });
    let url = `/rest/?method=flickr.photos.search&api_key=${apikey}&accuracy=11&lat=${this.state.latitude}&lon=${this.state.longitude}&per_page=20&`;
    fetchFromPublicApi(url).then(
      response => response.json())
      .then(result => {

        for (var i = 0; i < result.photos.photo.length; i++) {
          this._fetchInfoForImg(result.photos.photo[i].id);
        };
        this.setState({
          loading: false,
        });
      });
  }

  _fetchInfoForImg(id) {
    this.setState({ loading: true, });

    let url = `/rest/?method=flickr.photos.getInfo&api_key=${apikey}&photo_id=${id}&`;

    fetchFromPublicApi(url).then(
      response => response.json())
      .then(result => {
        let photo = result.photo;
        this.setState({
          markers: [...this.state.markers, {
            id: photo.id,
            title: photo.title,
            latlng: {
              latitude: Number(photo.location.latitude),
              longitude: Number(photo.location.longitude),
            },
            smalluri: `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_m.jpg`,
            biguri: `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_h.jpg`
          }],
        });

      });
  }


  render() {

    return (
      this.state.isConnected ?
        this.state.loading ?
          <View style={container}>
            <ActivityIndicator size="large" color="#0063DC" />
          </View>
          :
          <View style={container}>
            {this.state.markers.length > 0 &&
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: this.state.latitude,
                  longitude: this.state.longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
              >

                {this.state.markers.map(marker => (
                  <Marker key={marker.id}
                    coordinate={marker.latlng}
                    onPress={() => this.props.navigation.navigate('Image', { imgurl: marker.biguri })}
                  >
                    
                  </Marker>
                ))}

              </MapView>
            }
          </View>
        : <Text>No internet connection</Text>
    );
  }
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

const Routes = createStackNavigator(
  {
    Main: {
      screen: MapFeed,
      navigationOptions: ({ navigation, screenProps }) => ({
        headerTitle: <LogoTitle />,
      }),
    },
    Image: {
      screen: ImageDetails,
      navigationOptions: ({ navigation, screenProps, props }) => ({
        headerRight: (
          <LogoTitle placement='right' />
        ),
      }),
    }
  },
  {
    initialRouteName: 'Main',
    navigationOptions: Nav,
  }

);

export default Routes;
