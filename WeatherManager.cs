using UnityEngine;

public class WeatherManager : MonoBehaviour
{
    public Material sunnySkybox;
    public Material rainySkybox;
    public ParticleSystem rainEffect;
    public Light sunLight;
    private bool isRaining = false;

    void Start()
    {
        SetSunny();
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.T))
        {
            if (isRaining) SetSunny();
            else SetRainy();
        }
    }

    public bool GetIsRaining() { return isRaining; }

    void SetSunny()
    {
        RenderSettings.skybox = sunnySkybox;
        if (rainEffect != null) rainEffect.Stop();
        if (sunLight != null) sunLight.intensity = 1.2f;
        isRaining = false;
    }

    void SetRainy()
    {
        RenderSettings.skybox = rainySkybox;
        if (rainEffect != null) rainEffect.Play();
        if (sunLight != null) sunLight.intensity = 0.6f;
        isRaining = true;
    }
}
