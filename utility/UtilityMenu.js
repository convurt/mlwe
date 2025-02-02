// File: src/utility/UtilityMenu.js

import React from 'react';
import {StyleSheet, View} from 'react-native';
import {IconButton, Menu, Snackbar} from 'react-native-paper';

const UtilityMenu = ({
                         index,
                         menuVisible,
                         setMenuVisible,
                         snackbarVisible,
                         setSnackbarVisible,
                         onDelete,
                         onShareSocial,
                         onShareWeSPN
                     }) => {
    const closeMenu = () => setMenuVisible(null);

    return (
        <>
            <View style={styles.iconContainer}>
                <Menu
                    visible={menuVisible === index}
                    onDismiss={closeMenu}
                    anchor={
                        <IconButton
                            icon="dots-horizontal"
                            size={20}
                            onPress={() => setMenuVisible(index)}
                            style={styles.menuButton}
                        />
                    }
                >

                    <Menu.Item
                        onPress={() => {
                            onShareSocial?.();
                            closeMenu();
                        }}
                        title="Share"
                    />
                    <Menu.Item
                        onPress={() => {
                            onShareWeSPN?.();
                            closeMenu();
                        }}
                        title="Share on WeSPN"
                    />
                    <Menu.Item
                        onPress={() => {
                            onDelete?.();
                            closeMenu();
                        }}
                        title="Delete"
                    />
                    <Menu.Item
                        onPress={closeMenu}
                        title="Cancel"
                    />
                </Menu>
            </View>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
            >
                Thank you for your report. The video will be reviewed.
            </Snackbar>
        </>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    menuButton: {
        // optional styling
    }
});

export default UtilityMenu;
