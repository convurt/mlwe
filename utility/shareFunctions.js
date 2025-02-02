// 1) Example: Copy (or reference) the user's highlight into the "showcase_games" doc.
//    This function appends a new highlight object to an array in "showcase_games",
//    making it visible where your app already reads highlights.

import {doc, updateDoc, arrayUnion, collection, addDoc, setDoc} from 'firebase/firestore';
import {db} from '@/utility/firebaseConfig';

// highlight: the object with title, description, video, etc.
// userId: the current user ID (for ownership tracking, optional)
export async function shareVideoToPublic(highlight, userId) {
    const docId = highlight.id; // or highlight.videoFileName
    try {
        await setDoc(doc(db, "", docId), {
            ...highlight,
            sharedBy: userId,
            sharedAt: Date.now(),
            flagged: false // default to not flagged
        }, {merge: true}); // merges fields if doc already exists
        console.log("Shared/updated public video doc:", docId);
    } catch (error) {
        console.error("Error sharing video:", error);
    }
}
