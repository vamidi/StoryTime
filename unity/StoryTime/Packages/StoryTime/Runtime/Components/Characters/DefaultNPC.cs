using UnityEngine;

namespace DatabaseSync.Components.Characters
{
	public class DefaultNPC : MonoBehaviour
	{
		public StoryComponent StoryComponent => _storyComponent;

		private StoryComponent _storyComponent;

		// Start is called before the first frame update
		void Start()
		{
			_storyComponent = GetComponent<StoryComponent>();
		}
	}
}
