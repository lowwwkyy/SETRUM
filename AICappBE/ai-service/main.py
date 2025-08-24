# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from statsmodels.tsa.statespace.sarimax import SARIMAXResults
import os

# Load SARIMAX model
try:
    model = SARIMAXResults.load("forecast_model.pkl")
    print("SARIMAX model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

app = FastAPI()

class EnergyData(BaseModel):
    date: str
    energy_consumption_kwh: float

class BudgetForecastRequest(BaseModel):
    historical_data: List[EnergyData]
    budget: float
    current_date: str

class DailyUsage(BaseModel):
    date: str
    daily_kwh: float
    cumulative_kwh: float
    is_forecast: bool

class BudgetForecastResponse(BaseModel):
    monthly_usage_forecast: List[DailyUsage]
    budget_limit: float
    predicted_total_usage: float
    will_exceed_budget: bool
    days_passed: int
    days_remaining: int
    consumption_so_far: float

def prepare_daily_data(historical_data: List[EnergyData]) -> pd.DataFrame:
    """Convert historical data to daily aggregated format"""
    data_dicts = [{"Date": item.date, "total_daily_energy_kWh": item.energy_consumption_kwh} 
                  for item in historical_data]
    
    df = pd.DataFrame(data_dicts)
    df['Date'] = pd.to_datetime(df['Date'])
    
    # Group by date and sum energy consumption (in case multiple entries per day)
    df_daily = df.groupby('Date').agg({
        'total_daily_energy_kWh': 'sum'
    }).reset_index()
    
    # Add time-based features
    df_daily['Day_of_week'] = df_daily['Date'].dt.day_name()
    df_daily['Month'] = df_daily['Date'].dt.month
    
    return df_daily

def predict_budget_outcome(budget: float, daily_consumption_df: pd.DataFrame, 
                          today_str: str, sarimax_result) -> tuple:
    """
    Predict monthly budget outcome using SARIMAX model
    Returns: (monthly_cumulative_usage, budget_limit, prediction_details)
    """
    today = pd.to_datetime(today_str)
    df = daily_consumption_df.copy().set_index('Date')
    
    # Get start of current month and total days in month
    start_of_month = today.to_period('M').start_time
    total_days_in_month = today.days_in_month
    
    # Filter data for current month up to today
    current_month_data = df.loc[start_of_month:today]
    consumption_so_far = current_month_data['total_daily_energy_kWh'].sum()
    days_passed_in_month = len(current_month_data)
    
    print(f"--- This Month's Data (up to {today.strftime('%Y-%m-%d')}) ---")
    print(f"Energy Consumption so far: {consumption_so_far:.2f} kWh")
    print(f"Days passed: {days_passed_in_month} days")
    print("--------------------------------------")
    
    # Calculate days remaining in month
    days_to_forecast = total_days_in_month - days_passed_in_month
    
    prediction_details = {
        'consumption_so_far': consumption_so_far,
        'days_passed': days_passed_in_month,
        'days_remaining': days_to_forecast,
        'total_days_in_month': total_days_in_month
    }
    
    if days_to_forecast <= 0:
        print("Month is already over, no forecast needed.")
        monthly_cumulative_usage = current_month_data['total_daily_energy_kWh'].cumsum()
        prediction_details['predicted_total_usage'] = consumption_so_far
        prediction_details['will_exceed_budget'] = consumption_so_far > budget
        return monthly_cumulative_usage, budget, prediction_details
    
    # Generate forecast for remaining days
    try:
        future_forecast = sarimax_result.get_forecast(steps=days_to_forecast).predicted_mean
        
        # Create date range for forecast
        if len(current_month_data) > 0:
            last_historical_date = current_month_data.index.max()
        else:
            last_historical_date = start_of_month - pd.Timedelta(days=1)
            
        forecast_dates = pd.date_range(
            start=last_historical_date + pd.Timedelta(days=1), 
            periods=days_to_forecast
        )
        future_forecast.index = forecast_dates
        
        # Combine historical and forecast data
        if len(current_month_data) > 0:
            historical_daily = current_month_data['total_daily_energy_kWh']
            full_month_daily_usage = pd.concat([historical_daily, future_forecast])
        else:
            full_month_daily_usage = future_forecast
            
        monthly_cumulative_usage = full_month_daily_usage.cumsum()
        estimate_total_usage = monthly_cumulative_usage.iloc[-1]
        
        print(f"Predicted total usage for this month: {estimate_total_usage:.2f} kWh")
        print(f"Your Budget: {budget:.2f} kWh")
        
        will_exceed = estimate_total_usage > budget
        if will_exceed:
            print('\nWarning: Budget will likely be exceeded!')
        else:
            print('\nGood news: You should stay within budget!')
            
        prediction_details['predicted_total_usage'] = estimate_total_usage
        prediction_details['will_exceed_budget'] = will_exceed
        
        return monthly_cumulative_usage, budget, prediction_details
        
    except Exception as e:
        print(f"Error in forecasting: {e}")
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

@app.get("/")
def root():
    return {"message": "SETRUM Budget Forecasting API", "model_loaded": model is not None}

@app.post("/forecast", response_model=BudgetForecastResponse)
def forecast_budget(request: BudgetForecastRequest):
    """
    Forecast monthly energy budget outcome
    """
    if model is None:
        raise HTTPException(status_code=500, detail="SARIMAX model not loaded")
    
    try:
        # Prepare daily data
        daily_df = prepare_daily_data(request.historical_data)
        
        if len(daily_df) == 0:
            raise HTTPException(status_code=400, detail="No valid historical data provided")
        
        # Generate forecast
        cumulative_usage, budget_limit, details = predict_budget_outcome(
            request.budget, 
            daily_df, 
            request.current_date, 
            model
        )
        
        # Format response
        monthly_forecast = []
        current_date = pd.to_datetime(request.current_date)
        
        for date, cumulative_kwh in cumulative_usage.items():
            # Determine if this is historical or forecast data
            is_forecast = date > current_date
            
            # Calculate daily usage (difference from previous cumulative)
            if len(monthly_forecast) == 0:
                daily_kwh = cumulative_kwh
            else:
                daily_kwh = cumulative_kwh - monthly_forecast[-1].cumulative_kwh
            
            monthly_forecast.append(DailyUsage(
                date=date.strftime('%Y-%m-%d'),
                daily_kwh=float(daily_kwh),
                cumulative_kwh=float(cumulative_kwh),
                is_forecast=is_forecast
            ))
        
        return BudgetForecastResponse(
            monthly_usage_forecast=monthly_forecast,
            budget_limit=budget_limit,
            predicted_total_usage=details['predicted_total_usage'],
            will_exceed_budget=details['will_exceed_budget'],
            days_passed=details['days_passed'],
            days_remaining=details['days_remaining'],
            consumption_so_far=details['consumption_so_far']
        )
        
    except Exception as e:
        print(f"Error in forecast endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")

@app.post("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)