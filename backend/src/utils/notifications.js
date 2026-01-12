const Notification = require('../models/Notification');
const User = require('../models/User');
const Paper = require('../models/Paper');
const Note = require('../models/Note');

/**
 * Extract mentioned usernames from text (format: @username)
 */
function extractMentions(text) {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1].toLowerCase());
  }
  return [...new Set(mentions)]; // Remove duplicates
}

/**
 * Create notifications for all users (except the actor) when a public note is created
 */
async function notifyPublicNote(noteId, actorUserId) {
  try {
    const note = await Note.findById(noteId).populate('paperId', 'title');
    if (!note || note.visibility !== 'PUBLIC') {
      return;
    }

    const paper = await Paper.findById(note.paperId);
    if (!paper) return;

    const actor = await User.findById(actorUserId);
    if (!actor) return;

    // Get all approved users except the actor
    const users = await User.find({
      status: 'APPROVED',
      _id: { $ne: actorUserId }
    });

    const notifications = [];
    for (const user of users) {
      // Check user's notification preferences
      if (!user.notificationPreferences?.publicNote) {
        continue;
      }

      notifications.push({
        userId: user._id,
        type: 'PUBLIC_NOTE',
        title: 'New Public Note',
        message: `${actor.displayName} added a public note on "${paper.title}"`,
        relatedPaperId: paper._id,
        relatedNoteId: note._id,
        relatedUserId: actorUserId,
        read: false
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error creating public note notifications:', error);
  }
}

/**
 * Create notifications for mentioned users
 */
async function notifyMentions(noteId, actorUserId, noteContent) {
  try {
    const mentions = extractMentions(noteContent);
    if (mentions.length === 0) {
      return;
    }

    const note = await Note.findById(noteId).populate('paperId', 'title');
    if (!note) return;

    const paper = await Paper.findById(note.paperId);
    if (!paper) return;

    const actor = await User.findById(actorUserId);
    if (!actor) return;

    // Find mentioned users by username
    const mentionedUsers = await User.find({
      username: { $in: mentions },
      status: 'APPROVED',
      _id: { $ne: actorUserId }
    });

    const notifications = [];
    for (const user of mentionedUsers) {
      // Check user's notification preferences
      if (!user.notificationPreferences?.mention) {
        continue;
      }

      notifications.push({
        userId: user._id,
        type: 'MENTION',
        title: 'You were mentioned',
        message: `${actor.displayName} mentioned you in a note on "${paper.title}"`,
        relatedPaperId: paper._id,
        relatedNoteId: note._id,
        relatedUserId: actorUserId,
        read: false
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error creating mention notifications:', error);
  }
}

/**
 * Create notifications when a paper is added
 */
async function notifyPaperAdded(paperId, actorUserId) {
  try {
    const paper = await Paper.findById(paperId);
    if (!paper) return;

    const actor = await User.findById(actorUserId);
    if (!actor) return;

    // Get all approved users except the actor
    const users = await User.find({
      status: 'APPROVED',
      _id: { $ne: actorUserId }
    });

    const notifications = [];
    for (const user of users) {
      // Check user's notification preferences
      if (!user.notificationPreferences?.paperAdded) {
        continue;
      }

      notifications.push({
        userId: user._id,
        type: 'PAPER_ADDED',
        title: 'New Paper Added',
        message: `${actor.displayName} added a new paper: "${paper.title}"`,
        relatedPaperId: paper._id,
        relatedUserId: actorUserId,
        read: false
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error creating paper added notifications:', error);
  }
}

/**
 * Create notifications when a paper is edited
 */
async function notifyPaperEdited(paperId, actorUserId) {
  try {
    const paper = await Paper.findById(paperId);
    if (!paper) return;

    const actor = await User.findById(actorUserId);
    if (!actor) return;

    // Get all approved users except the actor
    const users = await User.find({
      status: 'APPROVED',
      _id: { $ne: actorUserId }
    });

    const notifications = [];
    for (const user of users) {
      // Check user's notification preferences
      if (!user.notificationPreferences?.paperEdited) {
        continue;
      }

      notifications.push({
        userId: user._id,
        type: 'PAPER_EDITED',
        title: 'Paper Updated',
        message: `${actor.displayName} updated the paper: "${paper.title}"`,
        relatedPaperId: paper._id,
        relatedUserId: actorUserId,
        read: false
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error creating paper edited notifications:', error);
  }
}

module.exports = {
  extractMentions,
  notifyPublicNote,
  notifyMentions,
  notifyPaperAdded,
  notifyPaperEdited
};

