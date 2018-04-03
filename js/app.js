var map, bounds, largeInfowindow, streetWindow, showIcon;
var markers = [];
var locations = [
  {title: 'Park Ave Penthouse', location: {lat: 40.7713024, lng: -73.9632393}},
  {title: 'Chelsea Loft', location: {lat: 40.7444883, lng: -73.9949465}},
  {title: 'Union Square Open Floor Plan', location: {lat: 40.7347062, lng: -73.9895759}},
  {title: 'East Village Hip Studio', location: {lat: 40.7281777, lng: -73.984377}},
  {title: 'TriBeCa Artsy Bachelor Pad', location: {lat: 40.7195264, lng: -74.0089934}},
  {title: 'Chinatown Homey Space', location: {lat: 40.7180628, lng: -73.9961237}}
];

function initMap() {
  // 创建地图
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 40.7413549, lng: -73.9980244},
    zoom: 13,
    mapTypeControl: false
  });

  largeInfowindow = new google.maps.InfoWindow();
  streetWindow = new google.maps.InfoWindow();
  var defaultIcon = makeMarkerIcon('0091ff');
  var highlightedIcon = makeMarkerIcon('FFFF24');
  showIcon = makeMarkerIcon('FF0000');
 
  for (var i = 0; i < locations.length; i++) {
    var position = locations[i].location;
    var title = locations[i].title;
    // 创建标记
    var marker = new google.maps.Marker({
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon,
        id: i
    });
    markers.push(marker);
    // 给marker添加鼠标点击事件
    marker.addListener('click', function() {
      var self = this;
      setInterval(function(){
        self.setAnimation(null);
      },1000);
      this.setAnimation(google.maps.Animation.BOUNCE);
      populateStreetWindow(this, streetWindow);
    });
    marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
    });
    marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });
  }
  bounds = new google.maps.LatLngBounds();
  // 设置marker在地图中的显示位置
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);
}
 
function searchMarker() {
  var geocoder = new google.maps.Geocoder();
  var address = document.getElementById('zoom-to-area-text').value;
  if (address == '') {
    window.alert('You must enter an area, or address.');
  } else {
    // 设置地图的显示位置
    geocoder.geocode(
      { address: address,
        componentRestrictions: {locality: 'New York'}
      }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          map.setCenter(results[0].geometry.location);
          map.setZoom(15);
        } else {
          window.alert('We could not find that location - try entering a more' +
              ' specific place.');
        }
      });
  }
}
//点击标记时出现在标记上的街景弹窗
function populateStreetWindow(marker, infowindow) {
  if (infowindow.marker != marker) {
    infowindow.setContent('');
    infowindow.marker = marker;
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    //显示marker位置的街景图片
    function getStreetView(data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
          nearStreetViewLocation, marker.position);
          infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
          var panoramaOptions = {
            position: nearStreetViewLocation,
            pov: {
              heading: heading,
              pitch: 30
            }
          };
        var panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), panoramaOptions);
      } else {
        infowindow.setContent('<div>' + marker.title + '</div>' +
          '<div>No Street View Found</div>');
      }
    }

    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    infowindow.open(map, marker);
  }
}

//点击列表时出现在标记上的信息弹窗
function populateInfoWindow(marker, infowindow) {
  infowindow.setContent('Loading...');
  if (infowindow.marker != marker) {
    // 获取foursquare推荐三种附近餐馆的名称
    $.ajax({
      type: 'GET',
      url: 'https://api.foursquare.com/v2/venues/explore',
      data: {
              client_id: 'yourid',//需要修改yourid
              client_secret: 'yoursecret',//需要修改yoursecret
              ll: marker.position.lat()+','+marker.position.lng(),
              section: 'food',
              v: '20180323',
              limit: 3
          },
     success: function(data){
              var items = data.response.groups[0].items;
              infowindow.setContent('<div>' + marker.title + '</div>'
                + '<div>Recommended Foods</div>' 
                + '<div>' + items[0].venue.name + '</div>'
                + '<div>' + items[1].venue.name + '</div>'
                + '<div>' + items[2].venue.name + '</div>');
        }
    })
    .fail(function() {  
      infowindow.setContent('<div>Not found Foods</div>') 
      console.log('加载FourSquare失败！');
    });
    
    infowindow.marker = marker;
    infowindow.addListener('closeclick', function() {
      infowindow.marker = null;
    });
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    
    infowindow.open(map, marker);
  }
}
//设置marker的图标颜色
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21,34));
    return markerImage;
}

var mapErrorHandler = function() {
  alert("谷歌地图加载失败！");
}

var ViewModel = function() {
    var self = this;
    this.markerList = ko.observableArray([]);
    this.selectList = ko.observable([
      {title: 'Park Ave Penthouse', location: {lat: 40.7713024, lng: -73.9632393}}]);
    this.valueList = ko.observableArray([]);
    locations.forEach(function(markerItem) {
        self.markerList.push(markerItem);
        self.valueList.push(markerItem);
    });
    //marker的筛选功能
    this.listFilter = function() {
      self.valueList([]);
      self.valueList.push(this.selectList()[0]);
      for (var i = 0; i < markers.length; i++) {
        if(markers[i].title == this.selectList()[0].title) {
          markers[i].setMap(map);
          bounds.extend(markers[i].position);
        }else {
          markers[i].setMap(null);
        }
      }
    }
    //marker列表的重置功能
    this.listReset = function() {
      self.valueList([]);
      locations.forEach(function(markerItem) {
        self.valueList.push(markerItem);
      });
      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
      }
    }
    //marker列表的显示功能
    this.listShow = function(name) {
      for (var i = 0; i < markers.length; i++) {
        if(markers[i].title == name.title) {
          markers[i].setMap(map);
          markers[i].setIcon(showIcon);
          bounds.extend(markers[i].position);
          populateInfoWindow(markers[i], largeInfowindow);
        }else {
          markers[i].setMap(null);
        }
      }
    }
}

ko.applyBindings(new ViewModel());

