import React from 'react';
import {
    Button,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableHighlight,
    TouchableNativeFeedback,
    TouchableOpacity,
    View
} from 'react-native';
import ActionButton from 'react-native-action-button';
import Swipeout from 'react-native-swipeout';
import Loading from './Loading';
import theme from '../theme';
import uuid from 'uuid';
import { Auth } from 'aws-amplify-react-native';

// BEGIN APPSYNC
import { compose } from 'react-apollo';
import * as GraphQL from '../graphql';
// END APPSYNC

// Platform-dependent Touchable component
const Touchable = (Platform.OS === 'android') ? TouchableNativeFeedback : TouchableHighlight;

// Stylesheet for the NoteList component
const styles = StyleSheet.create({
    addItemButton: {
        fontSize: 28
    },
    iosAddItemIcon: {
        fontSize: 20,
        color: '#A0A0A0',
        marginRight: 8
    },
    container: {
        backgroundColor: 'white',
        flex: 1
    },
    flatlistitem: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#C0C0C0',
        paddingBottom: 2
    }
});

// Stylesheet for the individual note items in the note list.
const noteItemStyles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
        flexDirection: 'column',
        height: 40,
        marginBottom: 2,
        marginLeft: 8,
        marginRight: 8,
        marginTop: 2
    },
    info: {
        color: '#C0C0C0',
        fontSize: 8
    },
    infoContainer: {
        flexBasis: 'auto'
    },
    title: {
        color: 'black',
        fontSize: 18
    },
    titleContainer: {
        flexGrow: 1
    }
});

const HeaderButton = (props) => {
    return (
        <TouchableOpacity onPress={(event) => props.onPress(event)}>
            <Text style={props.style}>{props.children}</Text>
        </TouchableOpacity>
    );
};

const NoteListItem = (props) => {
    const onPress = props.onPress ? props.onPress : () => { /* Do Nothing */ };
    
    return (
        <Touchable onPress={onPress}>
            <View style={noteItemStyles.container}>
                <View style={noteItemStyles.titleContainer}>
                    <Text style={noteItemStyles.title}>{props.item.title}</Text>
                </View>
                <View style={noteItemStyles.infoContainer}>
                    <Text style={noteItemStyles.info}>{props.item.noteId}</Text>
                </View>
            </View>
        </Touchable>
    );
}

/**
 * The Home Screen - this is a container component built on top of
 * the React Navigation system that is fed the list of notes to be
 * displayed
 */
class NoteList extends React.Component {
    /**
     * Initial state for the component.  The activeRow is the object that has an open
     * drawer for swiping.  Only one drawer can be open at any time.  It is null to
     * indicate no open drawer.
     */
    state = {
        activeRow: null
    };

    componentDidMount() {
        Auth.currentUserInfo().then(resp => this.props.navigation.setParams({username: resp.username}))
    };

    static navigationOptions = ({ navigation }) => {
        console.log('navigation', navigation)
        return {
            title: 'Notes',
            headerStyle: {
                backgroundColor: theme.headerBackgroundColor
            },
            headerTintColor: theme.headerForegroundColor,
            headerLeft: <Text>{navigation.state.params.username}</Text>,
            headerRight: (Platform.OS === 'ios')
                ? <HeaderButton style={styles.iosAddItemIcon} onPress={() => NoteListScreen.onAddNote(navigation.navigate)}>+</HeaderButton>
                : false
        }
    };

    /**
     * This has to be a static method because it is called in two places - by the floating
     * action button on Android and by the navigation options on iOS.
     */
    static onAddNote(navigate) {
        navigate('details', { noteId: uuid.v4() });
    }

    /**
     * Event handler called when the user swipes-left.
     */
    onSwipeOpen(item, rowId, dir) {
        this.setState({ activeRow: item.noteId });
    }

    /**
     * Event handler called when the system closes the swipe-drawer (either
     * because the user clicked elsewhere or the item was deleted)
     */
    onSwipeClose(item, rowId, dir) {
        if (item.noteId === this.state.activeRow && typeof dir !== 'undefined') {
            this.setState({ activeRow: null });
        }
    }

    /**
     * Event handler called when a user tries to press a note.
     */
    onViewNote(item) {
        const { navigate } = this.props.navigation;
        navigate('details', { noteId: item.noteId });
    }

    /**
     * Event handler called when a user tries to delete a note.
     */
    onDeleteNote(item) {
        this.props.deleteNote(item.noteId);
    }

    /**
     * Renders a single element in the list
     */
    renderItem(item, index) {
        const swipeSettings = {
            autoClose: true,
            close: item.noteId !== this.state.activeRow,
            onClose: (secId, rowId, dir) => this.onSwipeClose(item, rowId, dir),
            onOpen: (secId, rowId, dir) => this.onSwipeOpen(item, rowId, dir),
            right: [
                { onPress: () => this.onDeleteNote(item), text: 'Delete', type: 'delete' }
            ],
            rowId: index,
            sectionId: 1,
            style: styles.flatlistitem
        };

        return (
            <Swipeout {...swipeSettings}>
                <NoteListItem item={item} onPress={() => this.onViewNote(item)}/>
            </Swipeout>
        );
    }

    /**
     * Part of the React lifecycle that actually renders the component.
     */
    render() {
        const params = {
            noteList: {
                data: this.props.notes,
                extraData: this.state.activeRow,
                keyExtractor: (item) => item.noteId,
                renderItem: ({ item, index }) => this.renderItem(item, index)
            },
            actionButton: {
                buttonColor: theme.actionButtonColor,
                onPress: () => NoteListScreen.onAddNote(this.props.navigation.navigate)
            }
        }

        if (this.props.loading) {
            return <Loading/>;
        }

        return (
            <View style={styles.container}>
                <FlatList {...params.noteList} />
                {(Platform.OS === 'android') && <ActionButton {...params.actionButton} />}
            </View>
        );
    }
}

const NoteListScreen = compose(
    GraphQL.operations.ListAllNotes,
    GraphQL.operations.DeleteNote
  )(NoteList);

export default NoteListScreen;
