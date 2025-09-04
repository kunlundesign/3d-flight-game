using UnityEngine;
using UnityEngine.UI;

public class GameUIManager : MonoBehaviour
{
    public Text speedText;
    public Text weatherText;
    public GliderController glider;
    public WeatherManager weatherManager;

    void Update()
    {
        if (glider != null && speedText != null)
            speedText.text = $"Speed: {glider.speed:F1} km/h";
        if (weatherManager != null && weatherText != null)
            weatherText.text = $"Weather: {(weatherManager.GetIsRaining() ? "Rainy" : "Sunny" )}";
    }
}
