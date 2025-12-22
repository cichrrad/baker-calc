require 'json'
require 'net/http'
require 'uri'
require 'time'

class PriceUpdater
  def initialize(file_path)
    @file_path = file_path
  end

  def run
    puts ">> Starting Price Update for #{@file_path}..."
    
    unless File.exist?(@file_path)
      puts "!! Error: Could not find #{@file_path}"
      return
    end
    
    file_content = File.read(@file_path)
    ingredients = JSON.parse(file_content)
    
    # Filter for Rohlik items that have an ID
    rohlik_items = ingredients.select { |item| item['source'] == 'rohlik' && item['rohlik_id'] }
    
    if rohlik_items.empty?
      puts "!! No Rohlik items found to update."
      return
    end

    # Batch IDs
    ids_list = rohlik_items.map { |i| i['rohlik_id'] }.join(',')
    
    # Fetch Data (Refactored to a separate method for easier mocking if needed, 
    # but we will mock Net::HTTP directly in RSpec)
    api_data = fetch_from_api(ids_list)
    return unless api_data

    # Map for lookup: { 12345 => {data} }
    price_map = api_data.map { |p| [p['productId'].to_s, p] }.to_h # Ensure string keys

    updated_count = 0
    
    ingredients.each do |item|
      next unless item['source'] == 'rohlik'
      
      # Rohlik ID in JSON might be int, convert to string for lookup
      r_id = item['rohlik_id'].to_s
      remote_data = price_map[r_id]
      
      if remote_data
        update_item(item, remote_data)
        updated_count += 1
      else
        mark_missing(item)
      end
    end

    File.write(@file_path, JSON.pretty_generate(ingredients))
    puts ">> Success! Updated #{updated_count} items."
  end

  private

  def fetch_from_api(ids_list)
    uri = URI("https://www.rohlik.cz/api/v1/products/prices")
    params = { products: ids_list }
    uri.query = URI.encode_www_form(params)
    
    request = Net::HTTP::Get.new(uri)
    request['User-Agent'] = 'Mozilla/5.0 (compatible; PriceScraper/1.0)'
    # Cookie logic removed for simplicity as discussed, can be re-added here

    begin
      response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
        http.request(request)
      end
      
      if response.code == '200'
        return JSON.parse(response.body)
      else
        puts "!! API Error: #{response.code}"
        return nil
      end
    rescue StandardError => e
      puts "!! Network Error: #{e.message}"
      return nil
    end
  end

  def update_item(item, remote_data)
    current_price = remote_data.dig('price', 'amount')
    unit_price    = remote_data.dig('pricePerUnit', 'amount')

    # Update metadata
    item['auto_price'] = {
      'scraped_price' => current_price,
      'scraped_unit_price' => unit_price,
      'updated_at' => Time.now.iso8601,
      'status' => 'active'
    }

    # Update Logic
    if current_price
      item['package_price'] = current_price
      
      case item['unit']
      when 'g', 'ml'
        # Normalize to per 1 unit (divide kg/l price by 1000)
        if unit_price
          item['price_per_unit'] = (unit_price / 1000.0).round(5)
        end
      when 'ks'
        # Normalize to per piece (price / defined package count)
        count = item['package_size'].to_f
        if count > 0
          item['price_per_unit'] = (current_price / count).round(5)
        end
      else
        # Fallback
        item['price_per_unit'] = unit_price if unit_price
      end
    end
  end

  def mark_missing(item)
    puts "?? Warning: Item #{item['rohlik_id']} not found."
    if item['auto_price']
      item['auto_price']['status'] = 'missing'
      item['auto_price']['updated_at'] = Time.now.iso8601
    end
  end
end

# --- Execution Block ---
# Only run this if the script is executed directly (not when imported by test)
if __FILE__ == $0
  updater = PriceUpdater.new('ingredients.json')
  updater.run
end