using UnityEngine;

namespace DatabaseSync
{
	[CreateAssetMenu(fileName = "New PathAnchor", menuName = "DatabaseSync/Runtime Anchors/Path")]
	public class PathAnchor : RuntimeAnchorBase
	{
		[HideInInspector]
		public bool
			isSet = false; // Any script can check if the transform is null before using it, by just checking this bool

		private PathSO m_Path;

		public PathSO Path
		{
			get => m_Path;
			set
			{
				m_Path = value;
				isSet = m_Path != null;
			}
		}

		public void OnDisable()
		{
			m_Path = null;
			isSet = false;
		}
	}
}
