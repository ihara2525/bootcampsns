class UsersController < ApplicationController
  before_action :authenticate_user!, only: [:manage]
  before_action :reject_non_admin_user, only: [:manage]

  def create
    @user = User.create user_params
    render json: {errors: @user.errors.full_messages}, status: :bad_request and return if @user.errors.any?

    log_in @user
    render json: {name: @user.name, icon: icon_user_path(@user)} and return
  end

  def icon
    begin
      @user = User.find params[:id]
      send_data File.read "#{Rails.root}/public/icons/#{@user[:icon_file_name]}", disposition: 'inline'
    rescue
      send_data File.read "#{Rails.root}/public/icons/default_light.png", disposition: 'inline'
    end
  end

  def manage
    @users = User.all
  end

  private

  def user_params
    params.require(:user).permit(:user, :name, :pass, :icon_file_name)
  end
end
