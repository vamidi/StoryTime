using System;
using System.Collections.Generic;

namespace DatabaseSync.Components
{
	public class QuestEvent
	{
		public enum EventStatus
		{
			WAITING = 1 << 0,
			CURRENT = 1 << 1,
			DONE = 1 << 2
		}

		/// <summary>
		///
		/// </summary>
		public uint ID = UInt32.MaxValue;

		/// <summary>
		///
		/// </summary>
		public int Order = -1;

		/// <summary>
		///
		/// </summary>
		public string Title = "";

		/// <summary>
		///
		/// </summary>
		public string Description = "";


		/// <summary>
		///
		/// </summary>
		protected EventStatus Status = EventStatus.WAITING;

		public List<QuestPath> QuestPaths = new List<QuestPath>();

		public void UpdateQuestEvent(EventStatus status)
		{
			Status = status;
			// TODO Maybe trigger something else
		}
	}
}
