import React from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Loading from './Loading';
import theme from '../theme';

// BEGIN APPSYNC
import { compose } from 'react-apollo';
import * as GraphQL from '../graphql';
// END APPSYNC

// Stylesheet for the details page
const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        width: '100%'
    },
    fieldTitle: {
        color: '#606060',
        fontSize: 10
    },
    fieldContainer: {
        paddingTop: 4,
        paddingLeft: 8,
        paddingRight: 8,
        paddingBottom: 4
    },
    contentContainer: {
        flexGrow: 1
    },
    infoContainer: {

    },
    textInput: {
        borderBottomWidth: 1,
        borderBottomColor: theme.fieldIdColor,
        fontSize: 14
    },
    infoText: {
        fontSize: 10,
        color: '#808080'
    }
});

/**
 * Component for displaying the details of the specified note
 *
 * @class NoteDetails
 * @extends {React.Component}
 */
class NoteDetails extends React.Component {
    static navigationOptions = {
        title:'Note Details',
        headerStyle: {
            backgroundColor: theme.headerBackgroundColor
        },
        headerTintColor: theme.headerForegroundColor
    };

    /**
     * Constructor - loads the note from the store.
     */
    constructor(props) {
        super(props);
        this.state = {
            note: props.note || this.blankNote(props.navigation.state.params.noteId, props.navigation.state.params.owner)
        }
    }

    /**
     * Creates a blank note
     */
    blankNote(id, owner) {
        return {
            noteId: id,
            title: '',
            content: '',
            owner: owner
        };
    }

    /**
     * Updates a field in the note
     */
    onChangeField(text, field) {
        const note = Object.assign({}, this.state.note);    // turn state into a mutable object
        note[field] = text;
        this.setState({ note });
    }

    /**
     * React lifecycle method that is called when the view is closed.  This will
     * be called both when the user presses the Back button and when the application
     * is closed on the screen.  Used to save the note
     * @memberof NoteDetails
     */
    componentWillUnmount() {
        const note = Object.assign({}, this.state.note);  // turn state into a mutable object
        // DynamoDB does not allow zero-length fields
        if (note.title.length === 0) { note.title = ' '; }
        if (note.content.length === 0) { note.content = ' '; }
        // now save the note
        this.props.saveNote(this.state.note);
    }

    /**
     * React lifecycle method that is called when the view needs to be rendered
     */
    render() {
        const textFieldParams = {
            style: styles.textInput,
            underlineColorAndroid: 'rgba(0,0,0,0)',
            placeholderTextColor: '#A0A0A0'
        };

        if (this.props.loading) {
            return <Loading/>;
        }

        return (
            <View style={styles.container}>
                <View style={styles.fieldContainer}>
                    <Text style={styles.fieldTitle}>Title</Text>
                    <TextInput {...textFieldParams}
                        autoCapitalize="words"
                        onChangeText={text => this.onChangeField(text, 'title')}
                        placeholder="Note Title"
                        value={this.state.note.title} />
                </View>
                <View style={[styles.fieldContainer, styles.contentContainer]}>
                    <Text style={styles.fieldTitle}>Note Content</Text>
                    <TextInput {...textFieldParams}
                        autoCapitalize="sentences"
                        onChangeText={text => this.onChangeField(text, 'content')}
                        placeholder="Note Content"
                        multiline={true}
                        value={this.state.note.content} />
                </View>
            </View>
        );
    }
}

const NoteDetailsScreen = compose(
    GraphQL.operations.GetNote,
    GraphQL.operations.SaveNote
  )(NoteDetails);

export default NoteDetailsScreen;
