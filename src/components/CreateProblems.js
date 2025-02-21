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

  const handleCancel = () => {
    // Reset form fields or perform any cancel logic
    console.log('Form canceled');
  };

  return (
    <div className="bg-blue-700 container mx-auto p-1">
      <div className="p-6 bg-gray-100 shadow-lg rounded-lg mt-12">
        <div className="p-2 text-white rounded-t-lg bg-blue-700 shadow-xl mb-6">
          <h2 className="text-2xl mb-1">Log a Problem</h2>
          <p className="text-sm">Log an escalated issue as a problem to report an issue with a service or system.</p>
        </div>
        <form className="problem-form shadow-md rounded-lg p-4 bg-white" onSubmit={handleSubmit}>
          <div className="flex space-x-8">
            <div className="left-col w-1/3">
              <div className="form-group mb-4">
                <label>Problem Number</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full rounded"
                  value={problemNumber}
                  onChange={(e) => setProblemNumber(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Main Ticket</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full rounded"
                  value={mainTicket}
                  onChange={(e) => setMainTicket(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Ticket Status</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full rounded"
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value)}
                />
              </div>
            </div>

            <div className="middle-col w-1/3">
              <div className="form-group mb-4">
                <label>Related to Existing Record</label>
                <select
                  className="input-box border p-2 w-full rounded"
                  value={relatedToRecord}
                  onChange={(e) => setRelatedToRecord(e.target.value)}
                >
                  <option value="">Select Record</option>
                  <option value="Record1">Record 1</option>
                  <option value="Record2">Record 2</option>
                </select>
              </div>
            </div>

            <div className="right-col w-1/3">
              <div className="form-group mb-4">
                <label>Reported Date & Time</label>
                <input
                  type="datetime-local"
                  className="input-box border p-2 w-full rounded"
                  value={reportDateTime}
                  onChange={(e) => setReportDateTime(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Related Record</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full rounded"
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
                  className="input-box border p-2 w-full rounded"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Caller Surname</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full rounded"
                  value={callerSurname}
                  onChange={(e) => setCallerSurname(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Caller Email</label>
                <input
                  type="email"
                  className="input-box border p-2 w-full rounded"
                  value={callerEmail}
                  onChange={(e) => setCallerEmail(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Caller Contact</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full rounded"
                  value={callerContact}
                  onChange={(e) => setCallerContact(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Caller Location</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full rounded"
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
                  className="input-box border p-2 w-full rounded"
                  value={openedBy}
                  onChange={(e) => setOpenedBy(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Category</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full rounded"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Impact</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full rounded"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Urgency</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full rounded"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Priority</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full rounded"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Assignment Group</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full rounded"
                  value={assignmentGroup}
                  onChange={(e) => setAssignmentGroup(e.target.value)}
                />
              </div>
              <div className="form-group mb-4">
                <label>Assignee</label>
                <input
                  type="text"
                  className="input-box border p-2 w-full rounded"
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
                className="input-box border p-2 w-full rounded"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="form-group mb-4">
              <label>Description</label>
              <textarea
                className="input-box border p-2 w-full h-32 rounded"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="form-group mb-4">
              <label>Workaround</label>
              <textarea
                className="input-box border p-2 w-full h-32 rounded"
                value={workaround}
                onChange={(e) => setWorkaround(e.target.value)}
              />
            </div>
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="flex justify-end mt-6 space-x-2">
            <button
              type="button"
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition duration-300"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
            >
              Submit Problem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProblems;
