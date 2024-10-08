import React, {useEffect, useState} from 'react';
import Searching from '../components/Searching';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import CardPresensi from '../components/CardPresensi';
import appSettings from '../../Appsettings';
import {RefreshControl} from 'react-native';

type PresensiItem = {
  user_id: number;
  class_id: number;
  nis: string;
  name: string;
  grade: string;
  gender: number;
  class_name: string;
  class_type: string;
  start_date: string;
  end_date: string;
  attend_at: string | null;
  status: string | null;
  lastEditBy: string;
};

const filterOptions = [
  {id: '1', title: 'Semua'},
  {id: '2', title: 'Hari Ini'},
  {id: '3', title: 'Kemarin'},
];

const Presensi: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<PresensiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('1');
  const [searchText, setSearchText] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  // Function to handle filter selection
  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
  };

  // Function to handle search input
  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  // Filter data based on searchText and selectedFilter
  let filteredData = attendanceData;

  if (searchText) {
    filteredData = filteredData.filter(
      item =>
        item.class_name.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.start_date && item.start_date.startsWith(searchText)) ||
        (item.status &&
          item.status.toLowerCase().includes(searchText.toLowerCase())),
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (selectedFilter === '2') {
    // Filter untuk 'Hari Ini'
    const today = new Date();
    const todayDateString = formatDate(today.toISOString());

    filteredData = filteredData.filter(
      item => formatDate(item.start_date) === todayDateString,
    );
  } else if (selectedFilter === '3') {
    // Filter untuk 'Kemarin'
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // Set ke sehari sebelumnya
    const yesterdayDateString = formatDate(yesterday.toISOString());

    filteredData = filteredData.filter(
      item => formatDate(item.start_date) === yesterdayDateString,
    );
  }

  // Sort the data by start_date
  filteredData = filteredData.sort((a, b) => {
    const dateA = new Date(a.start_date);
    const dateB = new Date(b.start_date);
    return dateB.getTime() - dateA.getTime(); // Descending order
  });

  const fetchAttendanceData = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    console.log('Fetched Token:', token);
    if (!token) {
      console.log('No token found');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${appSettings.api}/attendances/`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      console.log('Fetched Data:', response.data); // Log fetched data
      setAttendanceData(response.data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false); // Stop the refreshing animation
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendanceData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#13A89D" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#13A89D']}
        />
      }>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Presensi</Text>
          <Searching onSearch={handleSearch} />
        </View>

        {/* Horizontal Filter List */}
        <FlatList
          data={filterOptions}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({item}) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.filterButton,
                selectedFilter === item.id && styles.selectedFilterButton,
              ]}
              onPress={() => handleFilterSelect(item.id)}>
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === item.id && styles.selectedFilterButtonText,
                ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.filterContainer}
        />

        <FlatList
          data={filteredData}
          renderItem={({item}) => <CardPresensi item={item} />}
          keyExtractor={item => item.user_id.toString()}
          contentContainerStyle={styles.contentContainer}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingBottom: hp('15%'),
  },
  header: {
    backgroundColor: '#13A89D',
    height: hp('20%'),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('2%'),
  },
  headerText: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#fff',
  },
  filterContainer: {
    marginTop: hp('4%'),
    flexDirection: 'row',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('2%'),
  },
  filterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: hp('5%'),
    width: wp('25%'),
    borderColor: '#13A89D',
    borderWidth: 2,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 15,
  },
  filterButtonText: {
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp('3.8%'),
  },
  selectedFilterButton: {
    backgroundColor: '#13A89D',
  },
  selectedFilterButtonText: {
    color: '#fff',
  },
  contentContainer: {
    marginTop: hp('2%'),
    paddingHorizontal: wp('3%'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Presensi;
