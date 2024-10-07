import React, { useState } from 'react';

const CreateProblems = () => {
  const [problemNumber, setProblemNumber] = useState('');
  const [mainTicket, setMainTicket] = useState('');
  const [ticketStatus, setTicketStatus] = useState('');
  const [relatedToRecord, setRelatedToRecord] = useState('');
  const [reportDateTime, setReportDateTime] = useState('');
  const [relatedRecord, setRelatedRecord] = useState('');
  const [callerName, setCallerName] = useState('');
  const [callerSurname, setCallerSurname] = useState('');
  const [callerEmail, setCallerEmail] = useState('');
  const [callerContact, setCallerContact] = useState('');
  const [callerLocation, setCallerLocation] = useState('');
  const [openedBy, setOpenedBy] = useState('');
  const [category, setCategory] = useState('');
  const [impact, setImpact] = useState('');
  const [urgency, setUrgency] = useState('');
  const [priority, setPriority] = useState('');
  const [assignmentGroup, setAssignmentGroup] = useState('');
  const [assignee, setAssignee] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [workaround, setWorkaround] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted');
  };

  return (
    <div className="bg-blue-700 container mx-auto p-1"> 
      <div className="p-6 bg-gray-300 shadow rounded-lg mt-12">
        <div className="p-6 mx-auto mb-3">
        <div className="p-2 text-white mx-auto rounded-b-lg bg-blue-700 shadow-2xl mb-6">
          <h2 className="text-2xl mb-2">Log a problem</h2>
          <p className="text-sm mb-2">Log an escalated issue as a problem to report an issue with a service or system.</p>

        </div>
       </div>
        <form className="problem-form shadow-md rounded" onSubmit={handleSubmit}>
          <div className="flex space-x-8">
            {/* Left Section */}
            <div className="left-col w-1/3">
              <div className="form-group mb-4">
                <label>Problem Number</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={problemNumber}
                  onChange={(e) => setProblemNumber(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Main Ticket</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={mainTicket}
                  onChange={(e) => setMainTicket(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Ticket Status</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value)}
                />
              </div>
            </div>

            {/* Middle Section */}
            <div className="middle-col w-1/3">
              <div className="form-group mb-4">
                <label>Relate to Existing Record</label>
                <select
                  className="input-box border p-2 w-full"
                  value={relatedToRecord}
                  onChange={(e) => setRelatedToRecord(e.target.value)}
                >
                  <option value="">Select Record</option>
                  <option value="Record1">Record 1</option>
                  <option value="Record2">Record 2</option>
                </select>
              </div>
            </div>

            {/* Right Section */}
            <div className="right-col w-1/3">
              <div className="form-group mb-4">
                <label>Reported Date & Time</label>
                <input
                  type="datetime-local"
                  className="input-box border p-2 w-full"
                  value={reportDateTime}
                  onChange={(e) => setReportDateTime(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Related Record</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={relatedRecord}
                  onChange={(e) => setRelatedRecord(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Caller Details */}
          <div className="flex space-x-8 mt-8">
            <div className="w-1/2">
              <div className="form-group mb-4">
                <label>Caller Name</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Caller Surname</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={callerSurname}
                  onChange={(e) => setCallerSurname(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Caller Email Address</label>
                <input
                  type="email"
                  className="input-box border p-2 w-full"
                  value={callerEmail}
                  onChange={(e) => setCallerEmail(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Caller Contact Number</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={callerContact}
                  onChange={(e) => setCallerContact(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Caller Location</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={callerLocation}
                  onChange={(e) => setCallerLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="w-1/2">
              <div className="form-group mb-4">
                <label>Opened By</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={openedBy}
                  onChange={(e) => setOpenedBy(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Category</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Impact</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Urgency</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Priority</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Assignment Group</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={assignmentGroup}
                  onChange={(e) => setAssignmentGroup(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Assignee</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Subject, Description, and Workaround */}
          <div className="mt-8">
            <div className="form-group mb-4">
              <label>Subject</label>
              <input
                type="text"
                className="input-box border p-2 w-full"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="form-group mb-4">
              <label>Description</label>
              <textarea
                className="input-box border p-2 w-full h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="form-group mb-4">
              <label>Workaround</label>
              <input
                type="text"
                className="input-box border p-2 w-full"
                value={workaround}
                onChange={(e) => setWorkaround(e.target.value)}
              />
            </div>
          </div>

          {/* Attachment Button */}
          <div className="form-group mb-4">
            <button className="bg-gray-300 py-2 px-4 rounded">Attachment</button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            <button type="button" className="bg-red-500 text-white py-2 px-4 rounded">Cancel</button>
            <button type="button" className="bg-blue-500 text-white py-2 px-4 rounded">Save</button>
            <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded">Submit</button>
          </div>
        </form>
        <div className="p-2 mx-auto text-center border-2 border-blue-700 bg-gradient-to-b from-blue-500 to-gray-400 shadow-2xl mt-6 rounded-t-lg">
          <h5 className="text-xl mb-6 text-white italic font-semibold drop-shadow-lg">© 2024 Greensoft solutions. All rights reserved.</h5>
        </div>
      </div>
    </div>
  );
};

export default CreateProblems;
