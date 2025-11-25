import { useState } from 'react';

const Tickets = () => {
  const [ticketStatus, setTicketStatus] = useState('Unassigned');

  return (
    <div className="bg-background-paper rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Some ticket title
      </h3>

      {/* Status Toggles */}
      <div className="flex flex-col gap-2 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="ticketStatus"
            value="Unassigned"
            checked={ticketStatus === 'Unassigned'}
            onChange={(e) => setTicketStatus(e.target.value)}
            className="text-primary-main focus:ring-primary-main"
          />
          <span className="text-sm text-text-primary">Unassigned</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="ticketStatus"
            value="Bug"
            checked={ticketStatus === 'Bug'}
            onChange={(e) => setTicketStatus(e.target.value)}
            className="text-primary-main focus:ring-primary-main"
          />
          <span className="text-sm text-text-primary">Bug</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="ticketStatus"
            value="Ticket"
            checked={ticketStatus === 'Ticket'}
            onChange={(e) => setTicketStatus(e.target.value)}
            className="text-primary-main focus:ring-primary-main"
          />
          <span className="text-sm text-text-primary">Ticket</span>
        </label>
      </div>

      {/* Reply Button */}
      <button className="w-full bg-primary-main text-primary-contrast rounded-sm px-3 py-2 text-sm hover:bg-primary-hover transition-colors">
        Reply
      </button>
    </div>
  );
};

export default Tickets;

