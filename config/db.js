import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const connectToDb = async () => {
  try {
    await mongoose.connect('mongodb+srv://mohdmubbashir71:MmaMongodbAtlas@cluster0.v0h3b0q.mongodb.net/user-behavior?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};

connectToDb();
