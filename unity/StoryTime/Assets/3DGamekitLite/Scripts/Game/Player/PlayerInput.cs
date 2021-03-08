using System.Collections;

using UnityEngine;
using UnityEngine.InputSystem;

using Cinemachine;

public class PlayerInput : MonoBehaviour
{
    public static PlayerInput Instance => s_Instance;

	protected static PlayerInput s_Instance;

	[HideInInspector]
    public bool playerControllerInputBlocked;

    protected Vector2 m_Movement;
    protected Vector2 m_Camera;
    protected bool m_Jump;
    protected bool m_Attack;
    protected bool m_Pause;
    protected bool m_Aim;
    protected bool m_Ability1;
    protected bool m_Ability2;
    protected bool m_Interact;
    protected bool m_ExternalInputBlocked;

    [SerializeField]
    private float mouseSensitivity = 1;

    public Vector2 MoveInput
    {
        get
        {
            if (playerControllerInputBlocked || m_ExternalInputBlocked)
                return Vector2.zero;
            return m_Movement;
        }
    }

    public Vector2 CameraInput
    {
        get
        {
            if (playerControllerInputBlocked || m_ExternalInputBlocked)
                return Vector2.zero;
            return m_Camera * mouseSensitivity;
        }
    }

    public bool JumpInput => m_Jump && !playerControllerInputBlocked && !m_ExternalInputBlocked;

    public bool Attack
    {
        get { return m_Attack && !playerControllerInputBlocked && !m_ExternalInputBlocked; }
    }
    public bool Aim
    {
        get { return m_Aim && !playerControllerInputBlocked && !m_ExternalInputBlocked; }
    }
    public bool Ability1
    {
        get { return m_Ability1 && !playerControllerInputBlocked && !m_ExternalInputBlocked; }
    }
    public bool Ability2
    {
        get { return m_Ability2 && !playerControllerInputBlocked && !m_ExternalInputBlocked; }
    }

    public bool Interact => m_Interact && !playerControllerInputBlocked && !m_ExternalInputBlocked;

    public bool Pause
    {
        get { return m_Pause; }
    }

    WaitForSeconds m_AttackInputWait;
    Coroutine m_AttackWaitCoroutine;

    const float k_AttackInputDuration = 0.03f;

    void Awake()
    {
        CinemachineCore.GetInputAxis = GetAxisCustom;
        m_AttackInputWait = new WaitForSeconds(k_AttackInputDuration);

        if (s_Instance == null)
            s_Instance = this;
        else if (s_Instance != this)
            throw new UnityException("There cannot be more than one PlayerInput script.  The instances are " + s_Instance.name + " and " + name + ".");
    }
    public float GetAxisCustom(string axisName)
    {
        if (axisName == "CameraX")
            return CameraInput.x;

        else if (axisName == "CameraY")
            return CameraInput.y;

        return 0;
    }
    void OnMove(InputValue value)
    {
        m_Movement = value.Get<Vector2>();
    }
    void OnLook(InputValue value)
    {
        m_Camera = value.Get<Vector2>();
    }
    void OnFire()
    {
	    if (m_AttackWaitCoroutine != null)
            StopCoroutine(m_AttackWaitCoroutine);

        m_AttackWaitCoroutine = StartCoroutine(AttackWait());
    }

    void OnAim(InputValue value)
    {
        m_Aim = value.isPressed;
    }

    void OnJump(InputValue value)
    {
	    m_Jump = value.isPressed;
    }

    void OnAbility1(InputValue value)
    {
	    m_Ability1 = value.isPressed;
    }
    void OnAbility2(InputValue value)
    {
	    m_Ability2 = value.isPressed;
    }

    IEnumerator AttackWait()
    {
        m_Attack = true;

        yield return m_AttackInputWait;

        m_Attack = false;
    }

    public bool HaveControl()
    {
        return !m_ExternalInputBlocked;
    }

    public void ReleaseControl()
    {
        m_ExternalInputBlocked = true;
    }

    public void GainControl()
    {
        m_ExternalInputBlocked = false;
    }
}
