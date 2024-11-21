import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, Switch, Image, Pressable } from "react-native";
import * as SystemUI from 'expo-system-ui';
import RNDateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { StatusBar } from "expo-status-bar";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from '../firebaseConfig';

SystemUI.setBackgroundColorAsync("#000");

interface LampSettings {
    alarm: String,
    autonomous: boolean,
    diffuseSessions: boolean;
    duration: number,
    intensity: number,
    power: boolean
}

const parseTimeString = (timeString: String) => {
    // Normalize the input to remove any non-breaking or unexpected spaces
    const cleanedString = timeString.replace(/\u202F/g, ' ').trim();

    // Split the cleaned string into time and modifier (AM/PM)
    const [time, modifier] = cleanedString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours !== 12) {
        hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
        hours = 0;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0); // Set local time
    return date;
};

export default function App(this: any) {
    const [fontsLoaded, error] = useFonts({
        "Figtree-Light": require("../assets/fonts/fonts/Figtree-Light.ttf"), //300
        "Figtree-Regular": require("../assets/fonts/fonts/Figtree-Regular.ttf"), //400
        "Figtree-Medium": require("../assets/fonts/fonts/Figtree-Medium.ttf"), //500
        "Figtree-SemiBold": require("../assets/fonts/fonts/Figtree-SemiBold.ttf"), //600
        "Figtree-Bold": require("../assets/fonts/fonts/Figtree-Bold.ttf"), //700
        "Figtree-ExtraBold": require("../assets/fonts/fonts/Figtree-ExtraBold.ttf"), //800
        "Figtree-Black": require("../assets/fonts/fonts/Figtree-Black.ttf"), //900
    });
    const [settings, setSettings] = useState<null | LampSettings>(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [auto, setAuto] = useState(false);
    const [standard, setStandard] = useState(false);
    const [duration, setDuration] = useState<number>(0);
    const [strength, setStrength] = useState<number>(0);
    const [date, setDate] = useState(parseTimeString("7:00 AM"));
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isEnabled) {
            setStandard(true);
        } else {
            setStandard(false);
            setAuto(false);
        }
    }, [isEnabled]);

    const fetchSettings = async () => {
        try {
            // Reference the specific "Adrian" document in the "Settings" collection
            const docRef = doc(db, "Settings", "Adrian");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // Access the document fields
                const fields = docSnap.data();

                setSettings({
                    alarm: fields.alarm,
                    autonomous: fields.autonomous,
                    diffuseSessions: fields.diffuseSession,
                    duration: fields.duration,
                    intensity: fields.intensity,
                    power: fields.power
                })
            } else {
                console.log("No such document!");
            }
        } catch (error) {
            console.error("Error fetching Adrian's document:", error);
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    useEffect(() => {
        if (settings) {
            setIsEnabled(settings.power);
            setDate(parseTimeString(settings.alarm));
            setDuration(settings.duration / 15 - 2);
            setStrength(settings.intensity);
        }
    }, [settings])

    useEffect(() => {
        if (error) throw error;

        if (fontsLoaded && settings) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, settings, error]);

    if (!fontsLoaded && !settings) {
        return null;
    }

    const Greeting = () => {
        // Get the current hour
        const currentHour = new Date().getHours();

        // Determine the greeting based on the time of day
        let greeting;
        if (currentHour < 12) {
            greeting = "Morning";
        } else if (currentHour < 18) {
            greeting = "Afternoon";
        } else {
            greeting = "Evening";
        }

        return <Text>{greeting}</Text>;
    }

    const toggleSwitch = () => {
        changePower();
        setIsEnabled(previousState => !previousState)
    };


    const changePower = async () => {
        const ref = doc(db, "Settings", "Adrian");
        await updateDoc(ref, {
            "power": !isEnabled,
            "diffuseSession": !isEnabled,
            "autonomous": !isEnabled
        });
    }    

    const toggleAuto = () => {
        if (isEnabled) {
            changeAuto();
            setAuto(previousState => !previousState)
            setStandard(false);
        }
    };

    const changeAuto = async () => {
        const ref = doc(db, "Settings", "Adrian");
        await updateDoc(ref, {
            "autonomous": !auto,
            "diffuseSession": !standard,
        });
    }

    const changeStandard = async () => {
        const ref = doc(db, "Settings", "Adrian");
        await updateDoc(ref, {
            "autonomous": !auto,
            "diffuseSession": !standard,
        });
    }

    const toggleStandard = () => {
        if (isEnabled) {
            changeStandard();
            setStandard(previousState => !previousState)
            setAuto(false);
        }
    }

    const changeDuration = async (num: number) => {
        let temp = (num + 1) * 15 + 15;
        const ref = doc(db, "Settings", "Adrian");
        await updateDoc(ref, {
            "duration": temp,
        });

        setDuration(num);
    }

    const changeIntensity = async (strength: number) => {
        const ref = doc(db, "Settings", "Adrian");
        await updateDoc(ref, {
            "intensity": strength,
        });

        setStrength(strength);
    }

    const changeAlarmTime = async () => {
        const newDate = new Date(date);
        const formattedTime = newDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        const ref = doc(db, "Settings", "Adrian");
        await updateDoc(ref, {
            "alarm": formattedTime,
        });
    }

    const onChange = (event: DateTimePickerEvent, selectedDate: Date | undefined) => {
        const currentDate = selectedDate || date;
        setShow(false); // Hides the picker after selection
        setDate(currentDate); // Updates the state with the selected date

        changeAlarmTime();
    };

    return (   
        <>
            <StatusBar backgroundColor="#000" style="light" />
            <View style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', padding: 16, gap: 44,  backgroundColor: '#000', minHeight: '100%' }}>
                <View style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'center', width: '100%'}}>
                        <View style={{ height: 40, width: 40 }}>
                            <Image
                                source={require('../assets/images/logo.png')}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </View>
                        <View style={{borderRadius: 250, height: 30, width: 30, borderColor: '#FFF', borderWidth: 2, backgroundColor: isEnabled ? '#FFFFFF55' : '#FFFFFF00'}} />
                    </View>

                    <View>
                        <Text style={{ fontFamily: 'Figtree-Bold', fontSize: 30, color: '#FFF', lineHeight: 42 }}>Hello, Adrian</Text>
                        <Text style={{ color: '#808080', fontFamily: 'Figtree-Medium', fontSize: 16 }}>Customize your SAD lamp</Text>
                    </View>
                </View>

                
                {/* Settings */}
                <View style={{display: 'flex', flexDirection: 'column', gap: 52}}>
                    <View>
                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'Figtree-SemiBold' }}>Power</Text>
                            <View>
                                <Switch
                                    trackColor={{ false: '#76757754', true: '#5D9D6A30' }}
                                    thumbColor={isEnabled ? '#5DDD6A' : '#f4f3f4'}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={toggleSwitch}
                                    value={isEnabled}
                                />
                            </View>
                        </View>

                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 32 }}>
                            <Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'Figtree-SemiBold' }}>Alarm</Text>
                            <View>
                                <RNDateTimePicker
                                    value={date}
                                    mode="time"
                                    is24Hour={false}
                                    display="default"
                                    onChange={onChange}
                                    themeVariant="dark"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Text style={{ color: '#FFF', fontSize: 24, fontFamily: 'Figtree-Bold', paddingBottom: 10}}>Settings</Text>

                        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
                            <Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'Figtree-SemiBold' }}>Autonomous</Text>
                            <View>
                                <Switch
                                    trackColor={{ false: '#76757754', true: '#5D9D6A30' }}
                                    thumbColor={auto ? '#5DDD6A' : '#f4f3f4'}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={toggleAuto}
                                    value={auto}
                                />
                            </View>
                        </View>

                        <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, width: '100%' }}>
                            
                            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10 }}>
                                <Text style={{ color: '#FFF', fontSize: 20, fontFamily: 'Figtree-SemiBold' }}>Diffuse Session</Text>
                                <View>
                                    <Switch
                                        trackColor={{ false: '#76757754', true: '#5D9D6A30' }}
                                        thumbColor={standard ? '#5DDD6A' : '#f4f3f4'}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={toggleStandard}
                                        value={standard}
                                    />
                                </View>
                            </View>

                            <View style={{
                                backgroundColor: '#FFFFFF15', borderRadius: 250, width: '100%', display: "flex",
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', gap: 10, position: 'relative'
                            }}>
                                <Pressable onPress={() => changeDuration(0)} style={{ backgroundColor: duration === 0 ? '#FFFFFF15' : '', height: 36, flexGrow: 1, borderRadius: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#FFF', fontFamily: 'Figtree-SemiBold' }}>30 mins</Text>
                                </Pressable>
                                <Pressable onPress={() => changeDuration(1)} style={{ backgroundColor: duration === 1 ? '#FFFFFF15' : '', height: 36, flexGrow: 1, borderRadius: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#FFF', fontFamily: 'Figtree-SemiBold' }}>45 mins</Text>
                                </Pressable>
                                <Pressable onPress={() => changeDuration(2)} style={{ backgroundColor: duration === 2 ? '#FFFFFF15' : '', height: 36, flexGrow: 1, borderRadius: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#FFF', fontFamily: 'Figtree-SemiBold' }}>60 mins</Text>
                                </Pressable>
                            </View>

                            
                            <View style={{
                                backgroundColor: '#FFFFFF15', borderRadius: 250, width: '100%', display: "flex",
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', gap: 10, position: 'relative'
                            }}>
                                <Pressable onPress={() => changeIntensity(0)} style={{ backgroundColor: strength === 0 ? '#FFFFFF15' : '', height: 36, flexGrow: 1, borderRadius: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#FFF', fontFamily: 'Figtree-SemiBold' }}>Low</Text>
                                </Pressable>
                                <Pressable onPress={() => changeIntensity(1)} style={{ backgroundColor: strength === 1 ? '#FFFFFF15' : '', height: 36, flexGrow: 1, borderRadius: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#FFF', fontFamily: 'Figtree-SemiBold' }}>Medium</Text>
                                </Pressable>
                                <Pressable onPress={() => changeIntensity(2)} style={{ backgroundColor: strength === 2 ? '#FFFFFF15' : '', height: 36, flexGrow: 1, borderRadius: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#FFF', fontFamily: 'Figtree-SemiBold' }}>High</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </>
    );
}