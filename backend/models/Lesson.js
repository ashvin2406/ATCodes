const mongoose = require('mongoose');

// Structured schema for each of the 10 ATCodes Pedagogical Sections
const sectionBlockSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    text: { type: String, default: '' },
    code: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    bullets: { type: [String], default: [] },
    notes: { type: String, default: '' },
    imageUrl: { type: String, default: '' }
  },
  { _id: false }
);

const lessonContentSchema = new mongoose.Schema(
  {
    curiosity: {
      type: sectionBlockSchema,
      default: () => ({ title: 'Curiosity', text: '', code: '' })
    },
    conceptDiscovery: {
      type: sectionBlockSchema,
      default: () => ({ title: 'Concept Discovery', text: '', code: '', language: 'javascript' })
    },
    realLifeConnection: {
      type: sectionBlockSchema,
      default: () => ({ title: 'Real-Life Connection', text: '' })
    },
    blackboard: {
      type: sectionBlockSchema,
      default: () => ({ title: "Teacher's Blackboard", text: '', bullets: [] })
    },
    behindTheScenes: {
      type: sectionBlockSchema,
      default: () => ({ title: 'Behind the Scenes', text: '', code: '' })
    },
    practical: {
      type: sectionBlockSchema,
      default: () => ({ title: "Let's Build Something!", text: '', code: '', language: 'javascript' })
    },
    developerThinking: {
      type: sectionBlockSchema,
      default: () => ({ title: 'Think Like a Developer', text: '' })
    },
    classroomChallenge: {
      type: sectionBlockSchema,
      default: () => ({ title: 'Classroom Challenge', text: '', code: '', language: 'javascript' })
    },
    developerKnowledge: {
      type: sectionBlockSchema,
      default: () => ({ title: 'Real Developer Knowledge', text: '' })
    },
    chapterMission: {
      type: sectionBlockSchema,
      default: () => ({ title: 'Chapter Mission', text: '' })
    },
    unmappedContent: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: [180, 'Lesson title cannot exceed 180 characters']
    },
    slug: {
      type: String,
      required: [true, 'Lesson slug is required'],
      trim: true,
      lowercase: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required']
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: [true, 'Chapter ID is required']
    },
    order: {
      type: Number,
      default: 0
    },
    estimatedDuration: {
      type: String,
      default: '25 mins'
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    },
    content: {
      type: lessonContentSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
lessonSchema.index({ chapterId: 1, order: 1 });
lessonSchema.index({ courseId: 1 });
lessonSchema.index({ status: 1 });
lessonSchema.index({ slug: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
