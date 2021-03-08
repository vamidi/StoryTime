using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.Events;

namespace DatabaseSync.Input
{
	[CreateAssetMenu(fileName = "InputReader", menuName = "DatabaseSync/Game/Input Reader")]
	public class InputReader : ScriptableObject, GameInput.IGameplayActions, GameInput.IDialoguesActions,
		GameInput.IMenusActions
	{
		// Gameplay
		public event UnityAction jumpEvent = delegate { };
		public event UnityAction jumpCanceledEvent = delegate { };
		public event UnityAction fireEvent = delegate { };
		public event UnityAction aimEvent = delegate { };
		public event UnityAction interactEvent = delegate { }; // Used to talk, pickup objects, interact with tools like the cooking cauldron
		public event UnityAction openInventoryEvent = delegate { }; // Used to bring up the inventory
		public event UnityAction pauseEvent = delegate { };
		public event UnityAction<Vector2> moveEvent = delegate { };
		public event UnityAction<Vector2, bool> cameraMoveEvent = delegate { };
		public event UnityAction enableMouseControlCameraEvent = delegate { };
		public event UnityAction disableMouseControlCameraEvent = delegate { };
		public event UnityAction startAbility1 = delegate { };
		public event UnityAction stopAbility1 = delegate { };

		// Shared between menus and dialogues
		public event UnityAction moveSelectionEvent = delegate { };

		// Dialogues
		public event UnityAction advanceDialogueEvent = delegate { };

		// Menus
		public event UnityAction menuMouseMoveEvent = delegate { };
		public event UnityAction menuConfirmEvent = delegate { };
		public event UnityAction menuCancelEvent = delegate { };
		public event UnityAction menuUnpauseEvent = delegate { };

		private GameInput gameInput;

		private void OnEnable()
		{
			if (gameInput == null)
			{
				gameInput = new GameInput();
				gameInput.Menus.SetCallbacks(this);
				gameInput.Gameplay.SetCallbacks(this);
				gameInput.Dialogues.SetCallbacks(this);
			}

			EnableGameplayInput();
		}

		private void OnDisable()
		{
			DisableAllInput();
		}

		public void OnFire(InputAction.CallbackContext context)
		{
			if (context.phase == InputActionPhase.Performed)
				fireEvent.Invoke();
		}

		public void OnAim(InputAction.CallbackContext context)
		{
			if(context.phase == InputActionPhase.Performed)
				aimEvent.Invoke();
		}

		public void OnOpenInventory(InputAction.CallbackContext context)
		{
			if (context.phase == InputActionPhase.Performed)
				openInventoryEvent.Invoke();
		}

		public void OnInteract(InputAction.CallbackContext context)
		{
			if (context.phase == InputActionPhase.Performed)
				interactEvent.Invoke();
		}

		public void Interact()
		{
			interactEvent.Invoke();
		}

		public void OnJump(InputAction.CallbackContext context)
		{
			if (context.phase == InputActionPhase.Performed)
				jumpEvent.Invoke();

			if (context.phase == InputActionPhase.Canceled)
				jumpCanceledEvent.Invoke();
		}

		public void OnMove(InputAction.CallbackContext context)
		{
			moveEvent.Invoke(context.ReadValue<Vector2>());
		}

		public void OnAbility1(InputAction.CallbackContext context)
		{
			switch (context.phase)
			{
				case InputActionPhase.Performed:
					startAbility1.Invoke();
					break;
				case InputActionPhase.Canceled:
					stopAbility1.Invoke();
					break;
			}
		}

		public void OnPause(InputAction.CallbackContext context)
		{
			if (context.phase == InputActionPhase.Performed)
				pauseEvent.Invoke();
		}

		public void OnLook(InputAction.CallbackContext context)
		{
			cameraMoveEvent.Invoke(context.ReadValue<Vector2>(), IsDeviceMouse(context));
		}

		public void OnMouseControlCamera(InputAction.CallbackContext context)
		{
			if (context.phase == InputActionPhase.Performed)
				enableMouseControlCameraEvent.Invoke();

			if (context.phase == InputActionPhase.Canceled)
				disableMouseControlCameraEvent.Invoke();
		}

		private bool IsDeviceMouse(InputAction.CallbackContext context) => context.control.device.name == "Mouse";

		public void OnMoveSelection(InputAction.CallbackContext context)
		{
			if (context.phase == InputActionPhase.Performed)
				moveSelectionEvent.Invoke();
		}

		public void OnAdvanceDialogue(InputAction.CallbackContext context)
		{
			if (context.phase == InputActionPhase.Performed)
				advanceDialogueEvent.Invoke();
		}

		public void OnConfirm(InputAction.CallbackContext context)
		{
			if (context.phase == InputActionPhase.Performed)
				menuConfirmEvent.Invoke();
		}

		public void OnCancel(InputAction.CallbackContext context)
		{
			if (context.phase == InputActionPhase.Performed)
				menuCancelEvent.Invoke();
		}

		public void OnMouseMove(InputAction.CallbackContext context)
		{
			if (context.phase == InputActionPhase.Performed)
				menuMouseMoveEvent.Invoke();
		}

		public void OnUnpause(InputAction.CallbackContext context)
		{
			if (context.phase == InputActionPhase.Performed)
				menuUnpauseEvent.Invoke                                                                                                                                                                                                                                                                                                                                                                         ();
		}

		public void EnableDialogueInput()
		{
			gameInput.Menus.Disable();
			gameInput.Gameplay.Disable();

			gameInput.Dialogues.Enable();
		}

		public void EnableGameplayInput()
		{
			gameInput.Menus.Disable();
			gameInput.Dialogues.Disable();

			gameInput.Gameplay.Enable();
		}

		public void EnableMenuInput()
		{
			gameInput.Dialogues.Disable();
			gameInput.Gameplay.Disable();

			gameInput.Menus.Enable();
		}

		public void DisableAllInput()
		{
			gameInput.Gameplay.Disable();
			gameInput.Menus.Disable();
			gameInput.Dialogues.Disable();
		}

		public bool LeftMouseDown() => Mouse.current.leftButton.isPressed;
	}
}
