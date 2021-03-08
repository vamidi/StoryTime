using UnityEngine;
using UnityEngine.Events;

using TMPro;

namespace DatabaseSync
{
	[CreateAssetMenu(menuName = "DatabaseSync/Configurations/Dialogue Setting File", fileName = "DialogueSettingConfig")]
	public class DialogueSettingConfig : ScriptableObject
	{
		[SerializeField]
		public TMP_FontAsset font;

		[SerializeField] [Range(15, 250)]
		public int charFontSize = 15;

		[SerializeField] [Range(15, 250)]
		public int dialogueFontSize = 15;

		public UnityAction FontChangeEvent = delegate { };
	}
}
