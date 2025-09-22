// use npm start, to start webapp, but cd FrontEnd, then cd my-react-app

import logo from './logo.svg';
import './App.css';

import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'; 
import { Auth } from "./Pages/Auth/index";
import { AdminDashboard } from "./Pages/AdminDashboard/index";
import {StudentInfo} from "./Pages/StudentInfo/index";
import { ReminderCalendar } from './Pages/Calendar/index';
import {GeneralPage} from './Pages/GeneralPage/index';
// Path is the url, and element is what is to be rendered

function App() {
  return (
    <div className='App'>
      <Router>
        <Routes>
          <Route path="/" exact element={ <Auth />} />
          <Route path="/AdminDashboard" element={ <AdminDashboard />} />
          <Route path="/StudentInfo/:studentId" element={<StudentInfo/>}/>
          <Route path="/Calendar" element={<ReminderCalendar/>}/>
          <Route path="/GeneralPage" element={<GeneralPage/>}/>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
